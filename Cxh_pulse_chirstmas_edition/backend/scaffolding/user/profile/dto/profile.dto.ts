import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword: string;
}

export class CheckResetTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;
}