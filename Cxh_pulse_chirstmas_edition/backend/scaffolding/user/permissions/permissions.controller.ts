import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permissions.service';

import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { throwServiceError } from 'scaffolding/common/error-handler/error-handler.utils';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import {
  CreatePermissionsBulkDto,
  UpdatePermissionDto,
} from './dto/permissions.dto';
import { PermissionEnum } from 'scaffolding/common/enum/enum';

@Controller('users/permissions')
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(private readonly permissionService: PermissionService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async createPermission(@Body() createPermission: CreatePermissionsBulkDto) {
    try {
      const result =
        await this.permissionService.createPermissions(createPermission);
      return new ApiResponse(result, 'Permission created successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        `Permission -> CreatePermission`,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async findAll() {
    try {
      const result = await this.permissionService.findAll();
      return new ApiResponse(result, 'Permissions fetched successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        `Permission -> GetAllPermissions`,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async updatePermission(
    @Param('id') id: string,
    @Body() body: UpdatePermissionDto,
  ) {
    try {
      const result = await this.permissionService.updatePermission(id, body);
      return new ApiResponse(result, 'Permission updated successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        `Permission -> UpdatePermission`,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async softDeletePermission(@Param('id') id: string) {
    try {
      const result = await this.permissionService.softDeletePermission(id);
      return new ApiResponse(result, 'Permission deleted successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        `Permission -> DeletePermission`,
      );
    }
  }

  @Post(':id/restore')
  async restorePermission(@Param('id') id: string) {
    try {
      const result = await this.permissionService.restorePermission(id);
      return new ApiResponse(result, 'Permission restored successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        `Permission -> RestorePermission`,
      );
    }
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async hardDeletePermission(@Param('id') id: string) {
    try {
      const result = await this.permissionService.hardDeletePermission(id);
      return new ApiResponse(result, 'Permission permanently deleted successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        `Permission -> HardDeletePermission`,
      );
    }
  }
}
