import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    const ivHex = this.configService.get<string>('ENCRYPTION_IV');

    if (!keyHex || !ivHex) {
      throw new Error('Missing ENCRYPTION_KEY or ENCRYPTION_IV in configuration');
    }

    this.key = Buffer.from(keyHex, 'hex');
    this.iv = Buffer.from(ivHex, 'hex');
  }

  encrypt(text: string): string {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
      }

      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    } catch (error) {
      throw new InternalServerErrorException(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(encrypted: string): string {
    try {
      if (!encrypted || typeof encrypted !== 'string') {
        throw new Error('Invalid input: encrypted text must be a non-empty string');
      }

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    } catch (error) {
      throw new InternalServerErrorException(`Decryption failed: ${error.message}`);
    }
  }
}