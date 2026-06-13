import { IsEmail, IsIn, IsNumber, IsString } from 'class-validator';

export class SendEmailDto {
  @IsString()
  email:string

  @IsNumber()
  roleId: number;
}
