import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsEmail, IsOptional } from "class-validator";

export class EmailConfig {
  @ApiProperty({ type: String, example: 'smtp.mandrillapp.com' })
  @IsString()
  @IsNotEmpty()
  smtpHost: string;

  @ApiProperty({ 
    type: Number, 
    example: 587 
  })
  @IsInt()
  smtpPort: number;

  @ApiProperty({ 
    type: String, 
    example: 'name' 
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ type: String, example: 'abcd' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ type: String, example: 'smtp.mandrillapp.com' })
  @IsEmail()
  fromEmail: string;

  @ApiProperty({ type: String })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fromEmailAlias: string;
}