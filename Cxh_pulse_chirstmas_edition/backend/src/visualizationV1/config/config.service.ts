import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpsertConfigDto } from './dto/config.dto';
import { BizConfig } from '../entity/biz_config.entity';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(private dataSource: DataSource) {}

  async upsertConfig(upsertConfigDto: UpsertConfigDto) {
    this.logger.log(`upsertConfig called `);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const configRepo = queryRunner.manager.getRepository(BizConfig);

      if (!upsertConfigDto || Object.keys(upsertConfigDto).length === 0) {
        throw new BadRequestException(
          'No parameter values detected to create config setting',
        );
      }

      let threshold = await configRepo.findOne({
        where: { name: upsertConfigDto.name },
      });
      if (threshold) {
        threshold.config = {
          ...threshold.config,
          temperatureThreshold: upsertConfigDto.temperatureThreshold,
          precipitationThreshold: upsertConfigDto.precipitationThreshold,
        };
        await configRepo.save(threshold);
      } else {
        threshold = configRepo.create({
          name: upsertConfigDto.name,
          config: {
            temperatureThreshold:
              upsertConfigDto.temperatureThreshold ??
              threshold.config.temperatureThreshold,
            precipitationThreshold:
              upsertConfigDto.precipitationThreshold ??
              threshold.config.precipitationThreshold,
          },
        });
        await configRepo.save(threshold);
      }
      await queryRunner.commitTransaction();
      this.logger.log(`Threshold setting created successfully `);
      return threshold;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  // async createConfig(createConfigDto: CreateConfigDto) {
  //   this.logger.log(`createConfig called `);

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const configRepo = queryRunner.manager.getRepository(BizThresholdConfig);

  //     if (!createConfigDto || Object.keys(createConfigDto).length === 0) {
  //       throw new BadRequestException("No parameter values detected to create config setting");
  //     }

  //     this.logger.debug(`Checking for existing threshold setting with parameter: ${createConfigDto.parameterName}`);
  //     const existing = await configRepo.findOne({
  //       where: { parameterName: createConfigDto.parameterName }
  //     });
  //     if (existing) {
  //       this.logger.warn(`Threshold setting already exists with parameter: ${createConfigDto.parameterName}`);
  //       throw new ConflictException('Threshold Setting already exists');
  //     }

  //     this.logger.debug(`Creating Threshold Setting`);
  //     const threshold = configRepo.create({
  //       ...createConfigDto
  //     });
  //     await configRepo.save(threshold);

  //     await queryRunner.commitTransaction();
  //     this.logger.log(`Threshold setting created successfully with ID: ${threshold.id}`);
  //     return threshold;

  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async findAllConfig() {
    this.logger.log('findAllConfig called');
    try {
      const config = await this.dataSource.getRepository(BizConfig).find();
      return config;
    } catch (error) {
      throw error;
    }
  }

  async findConfigByParameter(identifier: string) {
    this.logger.log(`findConfigByParameter called }`);

    try {
      this.logger.debug(
        `Looking up config setting with parameter: ${identifier}`,
      );

      const uuidRegex =
        /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[1-5][a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$/;
      let threshold: null | BizConfig;

      if (uuidRegex.test(identifier)) {
        threshold = await this.dataSource.getRepository(BizConfig).findOne({
          where: { id: identifier },
        });
      } else {
        threshold = await this.dataSource.getRepository(BizConfig).findOne({
          where: { name: identifier },
        });
      }

      if (!threshold) {
        this.logger.warn(
          `Threshold Config Setting not found with parameter: ${identifier}`,
        );
        throw new NotFoundException(
          ` Threshold Config Setting with parameter ${identifier} not found`,
        );
      }

      this.logger.log(
        `Threshold Config Setting found with parameter: ${identifier}`,
      );
      return threshold;
    } catch (error) {
      throw error;
    }
  }

  // async updateConfig(id: string, updateConfigDto: UpdateConfigDto) {
  //   this.logger.log(`updateConfig called with id: ${id}`,);

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const configRepo = queryRunner.manager.getRepository(BizThresholdConfig);
  //     this.logger.debug(`Looking up config setting with id: ${id}`);
  //     const threshold = await configRepo.findOne({
  //       where: { id }
  //     });

  //     if (!threshold) {
  //       this.logger.warn(`Threshold Config Setting not found with id: ${id}`);
  //       throw new NotFoundException(` Threshold Config Setting with id ${id} not found`);
  //     }

  //     this.logger.log(`Threshold Config Setting found with ID: ${id}`);

  //     if (!updateConfigDto || Object.keys(updateConfigDto).length === 0) {
  //       throw new BadRequestException("No update changes");
  //     }

  //     if (updateConfigDto.parameterName && updateConfigDto.parameterName !== threshold.parameterName) {
  //       const existingConfig = await configRepo.findOne({
  //         where: { parameterName: updateConfigDto.parameterName },
  //       });

  //       if (existingConfig) {
  //         throw new ConflictException(`Parameter name ${updateConfigDto.parameterName} already exists`);
  //       }
  //     }

  //     threshold.parameterName = updateConfigDto.parameterName ?? threshold.parameterName;
  //     threshold.thresholdValue = updateConfigDto.thresholdValue ?? threshold.thresholdValue;
  //     threshold.description = updateConfigDto.description ?? threshold.description;

  //     await configRepo.save(threshold);

  //     this.logger.log(`Threshold Config Setting updated successfully with ID: ${id}`);
  //     await queryRunner.commitTransaction();

  //     return threshold;
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     this.logger.error(`Error updating threshold config setting for id ${id}: ${error.message}`);
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  //   async softDeleteThreshold(identifier: string, thresholdKey: 'temperatureThreshold' | 'precipitationThreshold') {
  //   const configRepo = this.dataSource.getRepository(BizConfig);

  //   const uuidRegex = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[1-5][a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$/;
  //   let threshold: BizConfig | null;

  //   if (uuidRegex.test(identifier)) {
  //     threshold = await configRepo.findOne({ where: { id: identifier } });
  //   } else {
  //     threshold = await configRepo.findOne({ where: { name: identifier } });
  //   }

  //   if (!threshold) {
  //     throw new NotFoundException('Threshold config not found');
  //   }

  //   if (!(thresholdKey in threshold.config)) {
  //     throw new NotFoundException(`${thresholdKey} not found in config`);
  //   }

  //   if ((threshold.config)[`${thresholdKey}_deletedAt`]) {
  //     return { message: `${thresholdKey} already soft deleted` };
  //   }

  // await configRepo.softdelete(threshold[${thresholdKey}])
  //   return { message: `${thresholdKey} soft deleted successfully` };
  // }

  // async deleteConfig(identifier: string) {
  //   this.logger.log(`hardDeleteConfig called `);
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const configRepo = queryRunner.manager.getRepository(BizConfig);

  //     const uuidRegex = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[1-5][a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$/;
  //     let threshold: null | BizConfig;

  //     if (uuidRegex.test(identifier)) {
  //       threshold = await configRepo.findOne({ where: { id: identifier }, withDeleted: true });
  //     }
  //     else {
  //       threshold = await configRepo.findOne({ where: {name: identifier }, withDeleted: true });
  //     }
  //     if (!threshold) {
  //       this.logger.warn(`Threshold config settting not found `);
  //       throw new NotFoundException('Threshold config setting not found');
  //     }

  //     await configRepo.delete(threshold.id);
  //     await queryRunner.commitTransaction();
  //     this.logger.log(`Threshold config setting deleted successfully with ID: ${threshold.id}`);
  //     return { message: 'Threshold config setting deleted successfully' };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     this.logger.error(`Error in DeleteConfig: ${error.message}`);
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }

  // }
}
