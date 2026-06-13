import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CryptoService } from 'scaffolding/common/encryption/crypto.service';
import { MailerService } from 'scaffolding/common/email-service/mail.service';
import { ConfigService } from '@nestjs/config';
import { ConfigDto } from './dto/settings.dto';
import { SysConfiguration } from './entity/sys_configuration.entity';

@Injectable()
export class SettingsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(SysConfiguration)
    private readonly configRepo: Repository<SysConfiguration>,
    private readonly crypto: CryptoService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailerService: MailerService,
  ) {}

  // async upsertConfig(dto: ConfigDto) {
  //   return await this.dataSource.transaction(async (manager) => {
  //     const encryptedConfig: Record<string, any> = {};

  //     for (const [key, value] of Object.entries(dto.config)) {
  //       if (dto.name === 'email' && key === 'smtpPort') {
  //         const smtpPort = parseInt(value as string, 10);
  //         const secure = smtpPort === 465 ? 'true' : 'false';

  //         encryptedConfig.smtpPort = this.crypto.encrypt(smtpPort.toString());
  //         encryptedConfig.secure = this.crypto.encrypt(secure);
  //       } else {
  //         encryptedConfig[key] = this.crypto.encrypt(String(value));
  //       }
  //     }

  //     const existing = await manager
  //       .createQueryBuilder(SysConfiguration, 'config')
  //       .where('config.name = :name', { name: dto.name })
  //       .getOne();

  //     if (existing) {
  //       await manager
  //         .createQueryBuilder()
  //         .update(SysConfiguration)
  //         .set({ config: encryptedConfig })
  //         .where('name = :name', { name: dto.name })
  //         .execute();

  //       return { message: `Configuration '${dto.name}' updated successfully` };
  //     } else {
  //       await manager
  //         .createQueryBuilder()
  //         .insert()
  //         .into(SysConfiguration)
  //         .values([{ name: dto.name, config: encryptedConfig }])
  //         .execute();

  //       return { message: `Configuration '${dto.name}' created successfully` };
  //     }
  //   });
  // }

  async upsertConfig(dto: ConfigDto) {
    return await this.dataSource.transaction(async (manager) => {
      const encryptedConfig: Record<string, any> = {};

      for (const [key, value] of Object.entries(dto.config)) {
        if (dto.name === 'email' && key === 'smtpPort') {
          const smtpPort =
            typeof value === 'number' ? value : parseInt(value as string, 10);
          const secure = smtpPort === 465 ? 'true' : 'false';

          encryptedConfig.smtpPort = this.crypto.encrypt(smtpPort.toString());
          encryptedConfig.secure = this.crypto.encrypt(secure);
        } else {
          encryptedConfig[key] = this.crypto.encrypt(String(value));
        }
      }

      const existing = await manager
        .createQueryBuilder(SysConfiguration, 'config')
        .where('config.name = :name', { name: dto.name })
        .getOne();

      if (existing) {
        await manager
          .createQueryBuilder()
          .update(SysConfiguration)
          .set({ config: encryptedConfig })
          .where('name = :name', { name: dto.name })
          .execute();

        return { message: `Configuration '${dto.name}' updated successfully` };
      } else {
        await manager
          .createQueryBuilder()
          .insert()
          .into(SysConfiguration)
          .values([{ name: dto.name, config: encryptedConfig }])
          .execute();

        return { message: `Configuration '${dto.name}' created successfully` };
      }
    });
  }

  async getConfig(name: string): Promise<Record<string, any>> {
    try {
      const config = await this.configRepo.findOneBy({ name });
    if (!config) {
      throw new NotFoundException(`Configuration '${name}' not found`);
    }

    const decrypted: Record<string, any> = {};
    for (const [key, value] of Object.entries(config.config)) {
      decrypted[key] = this.crypto.decrypt(value);
    }

    if (name === 'email') {
      decrypted.smtpPort = parseInt(decrypted.smtpPort, 10);
      decrypted.secure = decrypted.secure === 'true';
    }

    return decrypted;
    }
    catch (error) { 
      throw error;
    }
  }

  async getAllConfigs(): Promise<Record<string, any>[]> {
    const configs = await this.configRepo.find();
    return configs.map((config) => {
      const decrypted: Record<string, any> = {};
      for (const [key, value] of Object.entries(config.config)) {
        decrypted[key] = this.crypto.decrypt(value);
      }
      return {
        name: config.name,
        config: decrypted,
      };
    });
  }

  async getSetting(key: string): Promise<string> {
    try {
      const config = await this.configRepo.findOneBy({ name: 'path' });
      if (!config) {
        return '';
      }
      const value = config.config[key];
      return value ? this.crypto.decrypt(value) : '';
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return '';
    }
  }
}
