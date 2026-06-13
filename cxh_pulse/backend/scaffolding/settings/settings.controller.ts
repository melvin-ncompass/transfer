import { ApiExtraModels } from '@nestjs/swagger';
import { SettingsSwagger } from './swagger/settings.swagger';
import {
  Controller,
  Put,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from 'scaffolding/user/auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { BrandingDto, ConfigDto, GetConfigDto, PathConfig } from './dto/settings.dto';
import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';
import { EmailConfigResponseDto, PathConfigResponseDto, BrandingResponseDto, BrandingConfigItemDto, EmailConfigItemDto, PathConfigItemDto } from './dto/swagger-response.dto';
import { EmailConfig } from 'scaffolding/common/email-service/dto/email-service.dto';
import { throwServiceError } from 'scaffolding/common/error-handler/error-handler.utils';

@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);
  constructor(private readonly service: SettingsService) {}

  @Put()
  @ApiExtraModels(EmailConfig,PathConfig,BrandingDto)
  @SwaggerEndpoint(SettingsSwagger,'UPSERT_CONFIG')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_SETTINGS)
  async upsertConfig(@Body() dto: ConfigDto) {
    try {
      return await this.service.upsertConfig(dto);
    } catch (error) {
      throw Error(`Failed to upsert config: ${error.message}`);
    }
  }

  @Get('branding')
  @SwaggerEndpoint(SettingsSwagger,'BRANDING_CONFIG')
  async getBrandingConfig() {
    try {
      return await this.service.getConfig('branding');
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Settings -> Branding',
      );
    }
  }

  @Get(':name')
  @ApiExtraModels(EmailConfigResponseDto,PathConfigResponseDto,BrandingResponseDto)
  @SwaggerEndpoint(SettingsSwagger,'GET_CONFIG')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_SETTINGS)
  async getConfig(@Param() params: GetConfigDto) {
    try {
      return await this.service.getConfig(params.name);
    } catch (error) {
      throw Error(`Failed to retrieve config: ${error.message}`);
    }
  }

  @Get()
  @ApiExtraModels(EmailConfigItemDto,PathConfigItemDto,BrandingConfigItemDto)
  @SwaggerEndpoint(SettingsSwagger,'GET_ALL_CONFIG')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_SETTINGS)
  async getAllConfigs() {
    try {
      return await this.service.getAllConfigs();
    } catch (error) {
      throw Error(`Failed to retrieve all configs: ${error.message}`);
    }
  }

  @Put('upload-path')
  @SwaggerEndpoint(SettingsSwagger,'UPLOAD_PATH')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_SETTINGS)
  async updateUploadPath(@Body('path') path: string) {
    try {
      await this.service.upsertConfig({
        name: 'path',
        config: {
          storagePath: path, // Using same path for both since they serve similar purposes
        },
      });
      return { message: 'Upload path updated successfully' };
    } catch (error) {
      throw Error(`Failed to update upload path: ${error.message}`);
    }
  }
}
