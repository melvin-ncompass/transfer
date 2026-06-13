import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateSubDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: "Software Engineering",
  })
  subDepartmentName: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  departmentId: number;
}