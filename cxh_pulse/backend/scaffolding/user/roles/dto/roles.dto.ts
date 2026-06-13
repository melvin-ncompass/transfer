import { IsArray, ArrayNotEmpty, IsString, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { ApiProperty } from "@nestjs/swagger";

export class AssignPermissionsDto {
  @ApiProperty({
    type: [String],
    required: true,
    example:['permission1', 'permission2']
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionNames: string[];
}

export class CreateRoleDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString({ message: 'Role name must be a string' })
  @IsNotEmpty({ message: 'Role name is required' })
  // @IsIn(['super admin', 'user'], {
  //   message: 'Role name must be either "super admin" or "user"',
  // })
  name: string;
}

// export class createRoleWithPermissionsDto {
//   @IsString()
//   roleName: string;

//   @IsArray()
//   @ArrayNotEmpty()
//   @IsString({ each: true })
//   permissionNames: string[];
// }

export class NestedCreatePermissionDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: [NestedCreatePermissionDto],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NestedCreatePermissionDto)
  children?: NestedCreatePermissionDto[];
}

export class CreateRoleWithPermissionsDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({
    type: [NestedCreatePermissionDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NestedCreatePermissionDto)
  permission: NestedCreatePermissionDto[];
}

// export class UpdateRoleDto {
//   @IsString({ message: 'Role name must be a string' })
//   @IsNotEmpty({ message: 'Role name is required' })
//   // @IsIn(['super admin', 'user'], {
//   //   message: 'Role name must be either "super admin" or "user"',
//   // })
//   name: string;
// }

// export class UpdateRoleDto {
//   @IsOptional()
//   @IsString({ message: 'Role name must be a string' })
//   @IsNotEmpty({ message: 'Role name is required' })
//   // @IsIn(['super admin', 'user'], {
//   //   message: 'Role name must be either "super admin" or "user"',
//   // })
//   name: string;

//   @IsOptional()
//   @IsArray()
//   @ArrayNotEmpty()
//   @IsString({ each: true })
//   permissionNames: string[];
// }

export class NestedPermissionDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: [NestedPermissionDto],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NestedPermissionDto)
  children?: NestedPermissionDto[];
}

export class UpdateRoleDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: [NestedPermissionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NestedPermissionDto)
  permission: NestedPermissionDto[];
}