import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional, IsArray, IsBoolean } from "class-validator";
import { PaginationDto } from "scaffolding/common/pagination/dto/pagination.dto";

export class CreateUserDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  name: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;

  @ApiProperty({
    type: [String],
    required: false,
    example:["roleId1","roleId2"]
  })
  @IsOptional()
  @IsArray({ message: 'Role IDs must be an array' })
  @IsString({ each: true, message: 'Each role ID must be a string' })
  roleIds?: string[];
}

export class DeactivateUserDto {
  @ApiProperty({
    type: Boolean,
    required: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  status: boolean
}

export class UpdateUserRoleDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString({ message: 'Role name must be a string' })
  @IsNotEmpty({ message: 'Role name is required' })
  roleName: string;
}

export class IdParamDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString({ message: 'ID must be a string' })
  id: string;
}

export class PaginatedUserFilterDto extends PaginationDto{ 
  @IsOptional()
  @IsString()
  isDetailed?: boolean;

  @IsOptional()
  @IsString()
  roleFilter?: string;
}