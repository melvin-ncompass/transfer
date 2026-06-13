import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword: string;
}

export class CheckResetTokenDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  token: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateUserDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  name?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;
}