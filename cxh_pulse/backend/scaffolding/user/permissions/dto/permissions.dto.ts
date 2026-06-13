import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ArrayNotEmpty, ValidateNested, IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from "class-validator";

export class CreatePermissionsBulkDto {
  @ApiProperty({
      type: [String],
      required: true,
  })
  @IsArray({ message: 'Permissions must be an array' })
  @ArrayNotEmpty({ message: 'Permissions array cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  permissions: CreatePermissionDto[];
}

export class CreatePermissionDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString({ message: 'Permission name must be a string' })
  @IsNotEmpty({ message: 'Permission name is required' })
  name: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Parent ID must be a string' })
  parentId?: string;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Type must be either "system" or "business"' })
  @IsIn(['system', 'business'])
  type?: 'system' | 'business'; // defaults to 'business'
}
export class UpdatePermissionDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Permission name must be a string' })
  name?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}