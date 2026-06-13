import { ApiExtraModels } from '@nestjs/swagger';
import { RolesSwagger } from './swagger/roles.swagger';
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
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './roles.service';

import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  CreateRoleWithPermissionsDto,
} from './dto/roles.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { ArchiveStatus, PermissionEnum } from 'scaffolding/common/enum/enum';
import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { PaginationDto } from 'scaffolding/common/pagination/dto/pagination.dto';
import { pagination } from 'scaffolding/common/pagination/pagination';
import { throwServiceError } from 'scaffolding/common/error-handler/error-handler.utils';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';
import { Interface } from 'readline';
import { GetRolesNonDetailResponseDto, GetRolesResponseDto } from './dto/roles-swagger-response.dto';
export interface viewAllRoles extends PaginationDto  {
  status?: ArchiveStatus
}

@Controller('/users/roles')
export class RoleController {
  private readonly logger = new Logger(RoleController.name);

  constructor(private readonly roleService: RoleService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @SwaggerEndpoint(RolesSwagger,'CREATE_ROLE')
  @Post()
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async createRole(@Body() body: CreateRoleDto) {
    try {
      const result = await this.roleService.createRole(body);
      return new ApiResponse(result, 'Role created successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, `Role -> CreateRole`);
    }
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiExtraModels(GetRolesResponseDto, GetRolesNonDetailResponseDto)
  @SwaggerEndpoint(RolesSwagger,'GET_ALL_ROLES')
  @Get('getAll')
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async findAllRoles(@Query() query: viewAllRoles) {
    try {
      const { roles, total } = await this.roleService.findAllRoles( query);
      if (query.limit && query.page) {
        return pagination(roles, total, query, 'Roles fetched successfully');
      }
      //const result = await this.roleService.findAllRoles(status, query);
      return new ApiResponse(roles, 'Roles fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, `Role -> getAllRoles`);
    }
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @SwaggerEndpoint(RolesSwagger,'GET_ONE_ROLE')
  @Get(':id')
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async findRoleById(@Param('id') id: string) {
    try {
      const result = await this.roleService.findRoleById(id);
      return new ApiResponse(result, 'Role fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, `Role -> get Role by Id`);
    }
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Put(':id')
  @SwaggerEndpoint(RolesSwagger,'UPDATE_ROLE')
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async updateRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    try {
      const result = await this.roleService.updateRoleAndPermissions(
        id,
        body
      );
      return new ApiResponse(result, 'Role updated successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, `Role -> UpdateRole`);
    }
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @SwaggerEndpoint(RolesSwagger,'DELETE_ROLE')
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async softDeleteRole(@Param('id') id: string) {
    try {
      const result = await this.roleService.softDeleteRole(id);
      return new ApiResponse(result, 'Role deleted successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, `Role -> DeleteRole`);
    }
  }

  @Post(':id/restore')
  @SwaggerEndpoint(RolesSwagger,'RESTORE_ROLE')
  async restoreRole(@Param('id') id: string) {
    try {
      return await this.roleService.restoreRole(id);
    } catch (error) {
      return throwServiceError(error, this.logger, `Role -> RestoreRole`);
    }
  }

  @Post('permissions')
  @SwaggerEndpoint(RolesSwagger,'CREATE_ROLE_WITH_PERMISSIONS')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async createRoleWithPermissions(@Body() body: CreateRoleWithPermissionsDto) {
    try {
      const result = await this.roleService.createRoleWithPermissions(
        body.roleName,
        body.permission,
      );
      return new ApiResponse(result, 'Role created successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Role -> createRoleWithPermissions',
      );
    }
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':roleId/mapPermissions')
  @SwaggerEndpoint(RolesSwagger,'MAP_PERMISSION')
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async mapPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body() body: AssignPermissionsDto,
  ) {
    try {
      const result = await this.roleService.mapPermissionsToRole(
        roleId,
        body.permissionNames,
      );
      return new ApiResponse(result, 'Permissions mapped successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'Role -> MapPermissions');
    }
  }

  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Put(':roleId/updatePermissions')
  // @Permissions(PermissionEnum.MANAGE_ROLES)
  // async updateRolePermissions(
  //   @Param('roleId') roleId: string,
  //   @Body() body: AssignPermissionsDto,
  // ) {
  //   try {
  //     const result = await this.roleService.updatePermissionsforRole(
  //       roleId,
  //       body.permissionNames,
  //     );
  //     return new ApiResponse(result, 'Role permissions updated successfully', 200);
  //   } catch (error) {
  //     return throwServiceError(error, this.logger, 'Role -> UpdatePermissions');
  //   }
  // }
}
