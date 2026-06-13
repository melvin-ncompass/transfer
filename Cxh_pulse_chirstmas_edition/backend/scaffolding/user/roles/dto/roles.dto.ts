import { IsArray, ArrayNotEmpty, IsString, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

export class AssignPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionNames: string[];
}

export class CreateRoleDto {
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
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NestedCreatePermissionDto)
  children?: NestedCreatePermissionDto[];
}

export class CreateRoleWithPermissionsDto {
  @IsString()
  @IsNotEmpty()
  roleName: string;

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
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NestedPermissionDto)
  children?: NestedPermissionDto[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NestedPermissionDto)
  permission: NestedPermissionDto[];
}