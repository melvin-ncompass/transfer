import { ApiProperty } from "@nestjs/swagger";

export class DepartmentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Engineering" })
  departmentName: string;
}
