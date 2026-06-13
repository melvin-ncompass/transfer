import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateDesignationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  designationName: string;
}