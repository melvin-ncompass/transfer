import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @ApiProperty({
    example: 'JohnDoe',
  })
  displayName: string;

  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
  })
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @ApiProperty({
    example: 'Password123!',
  })
  password: string;
}
