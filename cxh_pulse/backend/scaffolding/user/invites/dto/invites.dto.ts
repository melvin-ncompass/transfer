import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEmail, IsArray, ArrayNotEmpty, ArrayUnique, IsOptional } from "class-validator";

export class AcceptInviteDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  inviteToken: string;
}

export class CreateUserFromInviteDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  userInfoId: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  password: string;
}

export class InviteUserDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString({ message: 'Name must be a valid string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    type: [String],
    required: true,
    example:["role1","role2"]
  })
  @IsArray({ message: 'Role Names must be an array of strings' })
  //@ArrayNotEmpty({ message: 'Role Names cannot be an empty array' })
  @ArrayUnique({ message: 'Role Names must not contain duplicates' })
  // @IsIn(['super admin', 'user'], {
  //   each: true,
  //   message: 'Role name must be either "super admin" or "user"',
    // })
  @IsOptional()
  roleNames?: string[];

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a valid string' })
  phone?: string;
}

export class ReinviteUserDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}