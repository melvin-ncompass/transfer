import { IsString, IsNotEmpty, IsEmail, IsArray, ArrayNotEmpty, ArrayUnique, IsOptional } from "class-validator";

export class AcceptInviteDto {
  @IsString()
  inviteToken: string;
}

export class CreateUserFromInviteDto {
  @IsString()
  userInfoId: string;

  @IsString()
  password: string;
}

export class InviteUserDto {
  @IsString({ message: 'Name must be a valid string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsArray({ message: 'Role Names must be an array of strings' })
  @ArrayNotEmpty({ message: 'Role Names cannot be an empty array' })
  @ArrayUnique({ message: 'Role Names must not contain duplicates' })
  // @IsIn(['super admin', 'user'], {
  //   each: true,
  //   message: 'Role name must be either "super admin" or "user"',
  // })
  roleNames?: string[];

  @IsOptional()
  @IsString({ message: 'Phone must be a valid string' })
  phone?: string;
}

export class ReinviteUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}