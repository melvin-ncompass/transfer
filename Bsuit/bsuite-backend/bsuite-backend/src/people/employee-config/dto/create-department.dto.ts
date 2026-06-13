import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Engineering'
  })
  departmentName: string;
}