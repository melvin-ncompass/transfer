import { IsString, IsNotEmpty, IsInt, IsEmail, IsOptional } from "class-validator";

export class EmailConfig {
  @IsString()
  @IsNotEmpty()
  smtpHost: string;

  @IsInt()
  smtpPort: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  fromEmail: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fromEmailAlias: string;
}