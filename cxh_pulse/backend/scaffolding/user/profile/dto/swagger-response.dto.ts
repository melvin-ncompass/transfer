import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsDateString,
  IsArray,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { PermissionMappingsDto } from 'scaffolding/user/roles/dto/roles-swagger-response.dto';
export class PermissionDto {
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
    type: String,
    example: 'description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: Boolean,
    example: false,
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
export class VisualizationPermissionResponseDto {
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
    type: String,
    example: 'description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: Boolean,
    example: false,
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

  @ApiProperty({
    type: () => PermissionDto,
    nullable: true,
  })
  parent: PermissionDto | null;

  @ApiProperty({
    type: [PermissionDto],
    nullable: true,
  })
  children: PermissionDto[];
}
export class visualizationPermissionMappingsDto {
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
    type: [VisualizationPermissionResponseDto],
  })
  @IsArray()
  permission: VisualizationPermissionResponseDto[];
}
export class RolesDto {
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
}

export class RoleMappedDto {
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
    type: () => RolesDto,
  })
  role: RolesDto;
}
export class BusinessPermissionNamesDto {
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
    type: [BusinessPermissionNamesDto],
    nullable: true,
  })
  @IsArray()
  children: BusinessPermissionNamesDto | null;
}

export class PermissionNamesResponseDto {
  @ApiProperty({
    type: [String],
    example: ['READ_SESSION_LOGS', 'MANAGE USERS'],
  })
  @IsArray()
  @IsString({ each: true })
  system: string[];

  @ApiProperty({
    type: () => BusinessPermissionNamesDto,
  })
  business: BusinessPermissionNamesDto;
}

export class NavigationDto {
  @ApiProperty({
    type: String,
    example: 'Dashboard',
  })
  @IsString()
  title: string;

  @ApiProperty({
    type: String,
    example: '/path',
  })
  @IsString()
  path: string;

  @ApiProperty({
    type: [String],
    example: ['MANAGE_USERS', 'MANAGE_DASHBOARD'],
  })
  @IsArray()
  @IsString({ each: true })
  allowedPermissions: string[];
}
export class GetProfileResponseDto {
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
  @IsBoolean()
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
    nullable: true,
  })
  @IsDateString()
  updatedAt: Date | null;

  @ApiProperty({
    type: Date,
    example: '2025-12-17T12:09:06.760Z',
    nullable: true,
  })
  @IsDateString()
  deletedAt: Date | null;

  @ApiProperty({
    type: String,
    example: 'Role Name',
  })
  @IsString()
  roleName: string;

  @ApiProperty({
    type: () => PermissionNamesResponseDto,
  })
  @IsArray()
  permissions: PermissionNamesResponseDto;

  @ApiProperty({
    type: [NavigationDto],
  })
  @IsArray()
  navigation: NavigationDto[];
}
export class UserDetailDto {
  @ApiProperty({
    type: String,
    example: 'abc@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    example: 'name ',
  })
  @IsString()
  name: string;
}
export class CheckResetTokenResponseDto {
  @ApiProperty({
    type: String,
    example: 'valid',
  })
  @IsString()
  status: string;

  @ApiProperty({
    type: String,
    example: 'valid token',
  })
  @IsString()
  message: string;

  @ApiProperty({
    type: () => UserDetailDto,
  })
  user: UserDetailDto;
}
