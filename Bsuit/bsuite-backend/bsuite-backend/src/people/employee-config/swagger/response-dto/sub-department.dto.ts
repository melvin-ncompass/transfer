import { ApiProperty } from "@nestjs/swagger";
import { DepartmentResponseDto } from "./department-response.dto";

export class SubDepartmentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Backend Development" })
  subDepartmentName: string;

  @ApiProperty({ type: () => DepartmentResponseDto })
  department: DepartmentResponseDto;
}