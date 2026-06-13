import { Injectable } from "@nestjs/common";
import { Storage, Bucket, File } from "@google-cloud/storage";
import fetch from "node-fetch";
import path from "path";
import { Attachment } from "src/books/transact/entities/tenant.attachment.entity";
import { EntityManager } from "typeorm";
import { AttachmentsInterface } from "src/common/interface/attachment.interface";

@Injectable()
export class StorageService {
  private bucket: Bucket;

  constructor() {
    const storage = new Storage({
      keyFilename: process.env.CLOUD_STORAGE_JSON_PATH,
    });
    this.bucket = storage.bucket(process.env.BUCKET_NAME!);
  }

  // -----------------------------
  // Generate signed URL for a file
  // -----------------------------
  private async generateSignedUrl(fileRef: File) {
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + parseInt(process.env.IMAGE_URL_EXPIRE_TIME!, 10),
    });
    return url;
  }

  // -----------------------------
  // Upload a Multer file buffer
  // -----------------------------
  async uploadBuffer(
    file: Express.Multer.File,
    folder: string,
    uniqueFilename: string
  ) {
    const gcsPath = `${folder}/${uniqueFilename}`;
    const fileRef = this.bucket.file(gcsPath);

    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    return await this.generateSignedUrl(fileRef);
  }

  // -----------------------------
  // Upload an image from a URL
  // -----------------------------
  async uploadFromUrl(
    imageUrl: string,
    folder: string,
    uniqueFilename: string
  ) {
    const fileRef = this.bucket.file(`${folder}/${uniqueFilename}`);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return undefined;

      const buffer = Buffer.from(await response.arrayBuffer());

      await fileRef.save(buffer, {
        contentType: "image/jpeg",
        metadata: { cacheControl: "public, max-age=31536000" },
      });

      return `${folder}/${uniqueFilename}`;
    } catch (error) {
      console.error(`Error uploading from URL: ${error.message}`);
      return undefined;
    }
  }

  // -----------------------------
  // Get signed URL for existing file
  // -----------------------------
  async getSignedUrl(filePath: string) {
    const fileRef = this.bucket.file(filePath);
    const [exists] = await fileRef.exists();
    if (!exists) {
      console.log(`File not found in bucket: ${filePath}`);
      return undefined;
    }
    return await this.generateSignedUrl(fileRef);
  }

  // -----------------------------
  // Delete a file
  // -----------------------------
  async deleteFile(filePath: string): Promise<void> {
    const file = this.bucket.file(filePath);
    console.log(`Deleting file from GCS: ${filePath}`);
    try {
      await file.delete();
    } catch (err) {
      console.error(`Failed to delete file ${filePath}:`, err.message);
    }
  }

  // Generate unique filename in a folder
  async getUniqueFilenameFromBucket(
    filename: string,
    extension: string,
    folderPath: string
  ): Promise<string> {
    const prefix = `${folderPath}${filename}`;
    const [files] = await this.bucket.getFiles({ prefix });

    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedExt = extension.replace(".", "\\.");

    const pattern = new RegExp(
      `^${escapedFilename}(?: \\((\\d+)\\))?${escapedExt}$`
    );

    let hasMatch = false;
    let maxSuffix = 0;

    for (const file of files) {
      // Remove folder path (same as Django)
      const blobName = file.name.substring(folderPath.length);

      const match = blobName.match(pattern);
      if (match) {
        hasMatch = true;
        const suffix = match[1] ? parseInt(match[1], 10) : 0;
        maxSuffix = Math.max(maxSuffix, suffix);
      }
    }

    if (!hasMatch) {
      return `${filename}${extension}`;
    }

    return `${filename} (${maxSuffix + 1})${extension}`;
  }

  // Upload a raw buffer to GCS
  async uploadBufferToGcs(buffer: Buffer, gcsFilePath: string) {
    const fileRef = this.bucket.file(gcsFilePath);
    await fileRef.save(buffer, {
      metadata: { cacheControl: "public, max-age=31536000" },
    });
    return gcsFilePath;
  }

  async renameSubsequentFiles(
    bucketName: string,
    gcsFileName: string,
    transactionTypeId: string,
    transactionTypeName: string,
    paymentId: string | undefined,
    manager: EntityManager
  ) {
    const fileName = path.basename(gcsFileName);
    const folderPath = path.dirname(gcsFileName);
    const extension = path.extname(fileName);
    const match = fileName.match(
      new RegExp(`^(.+?) \\((\\d+)\\)${extension}$`)
    );

    if (!match) return;

    const baseName = match[1];
    let count = parseInt(match[2], 10) + 1;

    while (true) {
      const oldFileName = `${folderPath}/${baseName} (${count})${extension}`;
      console.log("Checking file:", oldFileName);

      const blob = this.bucket.file(oldFileName);
      const exists = await blob.exists();
      if (!exists[0]) break;

      console.log("File exists, renaming:", oldFileName);
      const newFileName = `${folderPath}/${baseName} (${count - 1})${extension}`;
      console.log("Renaming to:", newFileName);

      // Rename directly here without separate fn
      try {
        await blob.move(newFileName);
        console.log(`Renamed ${oldFileName} → ${newFileName} in bucket`);
      } catch (err) {
        console.error(`Failed to rename file ${oldFileName}:`, err.message);
        throw err;
      }

      // Update DB attachments
      const attachmentRecord = await manager.findOne(Attachment, {
        where: { transactionTypeId, transactionTypeName, paymentId },
      });

      if (attachmentRecord?.attachments?.length) {
        attachmentRecord.attachments = await this.updateFileName(
          attachmentRecord.attachments,
          `${baseName} (${count})${extension}`,
          `${baseName} (${count - 1})${extension}`
        );

        await manager.save(Attachment, attachmentRecord);
        console.log("Updated attachment record in DB");
      }

      count++;
    }
  }

  async updateFileName(
    jsonArray: AttachmentsInterface[],
    oldFileName: string,
    newFileName: string
  ): Promise<AttachmentsInterface[]> {
    for (const item of jsonArray) {
      if (item.filename === oldFileName) {
        item.filename = newFileName;

        const folderPath = item.path.split("/").slice(0, -1).join("/");
        item.path = `${folderPath}/${newFileName}`;
        break;
      }
    }
    return jsonArray;
  }
}
