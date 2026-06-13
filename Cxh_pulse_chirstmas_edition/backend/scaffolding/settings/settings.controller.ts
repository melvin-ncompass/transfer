import {
  Controller,
  Put,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'scaffolding/user/auth/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { ConfigDto, GetConfigDto } from './dto/settings.dto';
import { PermissionEnum } from 'scaffolding/common/enum/enum';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Put()
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
  async getBrandingConfig() {
    try {
      return await this.service.getConfig('branding');
    } catch (error) {
      throw Error(`Failed to retrieve config: ${error.message}`);
    }
  }

  @Get(':name')
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
