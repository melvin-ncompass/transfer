import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional, IsArray, IsBoolean } from "class-validator";

export class CreateUserDto {
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;

  @IsOptional()
  @IsArray({ message: 'Role IDs must be an array' })
  @IsString({ each: true, message: 'Each role ID must be a string' })
  roleIds?: string[];
}

export class DeactivateUserDto {
  @IsNotEmpty()
  @IsBoolean()
  status: boolean
}

export class UpdateUserRoleDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Role name must be a string' })
  @IsNotEmpty({ message: 'Role name is required' })
  roleName: string;
}

export class IdParamDto {
  @IsString({ message: 'ID must be a string' })
  id: string;
}