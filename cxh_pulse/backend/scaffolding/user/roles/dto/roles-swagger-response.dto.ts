import { CreateRoleWithPermissionsDto } from './roles.dto';
import {
  IsArray,
  IsUUID,
  IsString,
  IsDateString,
  IsEmail,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from 'scaffolding/user/dto/swagger-response.dto';

export class SystemPermissionsDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    example: 'permission name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'allows users to manage',
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  @IsString()
  enabled: boolean;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;
}

export class BusinessPermissionsDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    example: 'permission name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'allows users to manage',
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  parentId: string;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  @IsString()
  enabled: boolean;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: [BusinessPermissionsDto],
  })
  @IsArray()
  children: BusinessPermissionsDto[];
}

export class UsersDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsString()
  isArchived: boolean;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  deletedAt: Date;

  @ApiProperty({
    type: [UserInfoDto],
  })
  @IsArray()
  userInfo: UserInfoDto[];
}
export class GetRolesNonDetailResponseDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    example: 'name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsString()
  isDefault: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsString()
  isEditable: boolean;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;
}
export class GetRolesResponseDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    example: 'name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsString()
  isDefault: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsString()
  isEditable: boolean;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: [SystemPermissionsDto],
  })
  @IsArray()
  systemPermissions: SystemPermissionsDto[];

  @ApiProperty({
    type: [BusinessPermissionsDto],
  })
  @IsArray()
  businessPermissions: BusinessPermissionsDto[];

  @ApiProperty({
    type: [UsersDto],
  })
  @IsArray()
  users: UsersDto[];
}

export class CreateRoleResponseDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    example: 'name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsString()
  isDefault: boolean;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  deletedAt: Date;
}
export class PermissionResponseDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    example: 'permission name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'allows users to manage',
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  @IsString()
  isEnabled: boolean;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  deletedAt: Date;
}
export class PermissionMappingsDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  deletedAt: Date;

  @ApiProperty({
    type: [PermissionResponseDto],
  })
  @IsArray()
  permission: PermissionResponseDto[];
}

export class UserMappingDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  deletedAt: Date;

  @ApiProperty({
    type: [UsersDto],
  })
  @IsArray()
  user: UsersDto[];
}
export class GetOneRoleResponseDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    example: 'name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsString()
  isDefault: boolean;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
  })
  @IsDateString()
  deletedAt: Date;

  @ApiProperty({
    type: [PermissionMappingsDto],
  })
  @IsArray()
  permissionMappings: PermissionMappingsDto[];

  @ApiProperty({
    type: [PermissionMappingsDto],
  })
  @IsArray()
  visualizationPermissionMappings: PermissionMappingsDto[];

  @ApiProperty({
    type: [UsersDto],
  })
  @IsArray()
  userMappings: UsersDto[];
}
export class RoleDetailResponseDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    example: 'name',
  })
  @IsString()
  name: string;
}

export class UpdateRoleResponseDto {
  @ApiProperty({
    type: String,
    example: 'Role updated',
  })
  @IsString()
  message: string;

  @ApiProperty({
    type: () => RoleDetailResponseDto,
  })
  role: RoleDetailResponseDto;

  @ApiProperty({
    type: String,
    example: 'normal_update',
  })
  @IsString()
  operation: 'restore_and_replace' | 'normal_update';
}

export class AddedNumPermissionDto {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  @IsNumber()
  system: number;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  @IsNumber()
  business: number;
}

export class AddedPermissionDto {
  @ApiProperty({
    type: [String],
    example: ['MANAGE_USERS'],
  })
  @IsArray()
  @IsString({ each: true })
  system: string[];

  @ApiProperty({
    type: [String],
    example: ['MANAGE_DASHBOARD'],
  })
  @IsArray()
  @IsString({ each: true })
  business: string[];
}
export class CreateRoleWithPermissionsResponseDto {
  @ApiProperty({
    type: String,
    example: 'Role created',
  })
  @IsString()
  message: string;

  @ApiProperty({
    type: () => RoleDetailResponseDto,
  })
  role: RoleDetailResponseDto;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  @IsString()
  wasRestored: boolean;

  @ApiProperty({
    type: () => AddedNumPermissionDto,
  })
  added: AddedNumPermissionDto;

  @ApiProperty({
    type: () => AddedPermissionDto,
  })
  permissions: AddedPermissionDto;
}

export class MapPermissionsDto {
  @ApiProperty({
    type: String,
    example: 'Permission mapped',
  })
  @IsString()
  message: string;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  @IsNumber()
  added: number;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  @IsNumber()
  skipped: number;
}
