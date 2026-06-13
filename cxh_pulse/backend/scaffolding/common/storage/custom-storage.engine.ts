import { StorageEngine } from 'multer';
import { Request } from 'express';
import { SettingsService } from 'scaffolding/settings/settings.service';
import * as fs from 'fs';
import * as path from 'path';

type MulterCallback = (
  error: Error | null,
  info?: Partial<Express.Multer.File>,
) => void;
type RemoveCallback = (error: Error | null) => void;

export class CustomStorageEngine implements StorageEngine {
  constructor(private settingsService: SettingsService) {}

  async _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: MulterCallback,
  ) {
    try {
      const storagePath =
        (await this.settingsService.getSetting('storagePath')) ?? './uploads';
      console.log('storagePath', storagePath);
      const profilePicsPath = path.join(storagePath, 'profile-pics');

      if (!fs.existsSync(profilePicsPath)) {
        fs.mkdirSync(profilePicsPath, { recursive: true });
      }

      const filename = `${Date.now()}-${file.originalname}`;
      const finalPath = path.join(profilePicsPath, filename);

      const outStream = fs.createWriteStream(finalPath);
      file.stream.pipe(outStream);
      outStream.on('error', (err) => callback(err));
      outStream.on('finish', () =>
        callback(null, {
          path: finalPath,
          filename,
        }),
      );
    } catch (error) {
      callback(error);
    }
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: RemoveCallback,
  ) {
    fs.unlink(file.path, callback);
  }
}
