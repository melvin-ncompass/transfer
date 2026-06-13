import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AppConfig } from './app-config.schema';

@Injectable()
export class ConfigService {
  private readonly configPath: string;
  private readonly config: AppConfig | null;

  constructor() {
    this.configPath = process.env.MELCP_CONFIG_PATH
      ? resolve(process.env.MELCP_CONFIG_PATH)
      : resolve(__dirname, '../../melcp.config.json');

    this.config = this.loadConfig();
  }

  getConfigPath(): string {
    return this.configPath;
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  private loadConfig(): AppConfig | null {
    try {
      const raw = readFileSync(this.configPath, 'utf-8');
      return JSON.parse(raw) as AppConfig;
    } catch {
      return null;
    }
  }
}
