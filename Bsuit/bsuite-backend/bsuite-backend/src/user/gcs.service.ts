import { Injectable } from '@nestjs/common';
import { Bucket, Storage, File } from '@google-cloud/storage';
import fetch from 'node-fetch';
@Injectable()
export class GcsService {
  private bucket: Bucket;
  constructor() {
    const storage = new Storage({
      keyFilename: process.env.CLOUD_STORAGE_JSON_PATH,
    });
    this.bucket = storage.bucket(process.env.BUCKET_NAME!);
  }
  private async generateSignedUrl(fileRef: File) {
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + parseInt(process.env.IMAGE_URL_EXPIRE_TIME!, 10),
    });
    return url;
  }

  async uploadImage(file: Express.Multer.File, folder: string, uniqueFilename: string) {
    const fileName = `${folder}/${uniqueFilename}`;
    const fileRef = this.bucket.file(fileName);
    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    return await this.generateSignedUrl(fileRef);
  }

  async uploadImageFromUrl(imageUrl: string, folder: string, uniqueFilename: string) {
    const fileRef = this.bucket.file(`${folder}/${uniqueFilename}`);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return undefined;

      const buffer = Buffer.from(await response.arrayBuffer());

      await fileRef.save(buffer, {
        contentType: 'image/jpeg',
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      return `${folder}/${uniqueFilename}`;
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return undefined;
    }
  }

  async getSignedUrl(filePath: string) {
    const fileRef = this.bucket.file(filePath);
    const [exists] = await fileRef.exists();
    if (!exists) {
      console.log(`File not found in bucket: ${filePath}`);
      return undefined
    }
    return await this.generateSignedUrl(fileRef);
  }
  async deleteFile(filePath: string): Promise<void> {
    console.log(filePath,'filePath')
    const file = this.bucket.file(filePath);
    try {
      await file.delete();
    } catch (err) {
      console.error(`Failed to delete file ${filePath}:`, err.message);
    }
  }
}