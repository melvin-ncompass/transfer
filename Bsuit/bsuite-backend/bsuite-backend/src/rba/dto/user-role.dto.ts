import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UserRoleDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  roleId: number;
}
