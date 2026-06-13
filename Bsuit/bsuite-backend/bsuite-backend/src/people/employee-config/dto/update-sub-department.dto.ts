import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateSubDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: "Backend Development",
  })
  subDepartmentName: string;
}