import { Type } from "class-transformer";
import { IsArray, ArrayNotEmpty, ValidateNested, IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from "class-validator";

export class CreatePermissionsBulkDto {
  @IsArray({ message: 'Permissions must be an array' })
  @ArrayNotEmpty({ message: 'Permissions array cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  permissions: CreatePermissionDto[];
}

export class CreatePermissionDto {
  @IsString({ message: 'Permission name must be a string' })
  @IsNotEmpty({ message: 'Permission name is required' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Parent ID must be a string' })
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString({ message: 'Type must be either "system" or "business"' })
  @IsIn(['system', 'business'])
  type?: 'system' | 'business'; // defaults to 'business'
}
export class UpdatePermissionDto {
  @IsOptional()
  @IsString({ message: 'Permission name must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}