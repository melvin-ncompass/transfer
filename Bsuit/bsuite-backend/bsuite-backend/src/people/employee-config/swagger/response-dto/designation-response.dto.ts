import { ApiProperty } from "@nestjs/swagger";

export class DesignationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Engineering" })
  designationName: string;
}