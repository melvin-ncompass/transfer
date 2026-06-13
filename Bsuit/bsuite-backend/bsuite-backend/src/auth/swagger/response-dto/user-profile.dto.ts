import { ApiProperty } from "@nestjs/swagger";

export class UserProfileDto {
  @ApiProperty({ example: "pxil4p" })
  username: string;

  @ApiProperty({ example: "Xer" })
  displayName: string;

  @ApiProperty({ example: "user@example.com" })
  email: string;
  
  @ApiProperty({ example: true })
  verified: boolean;
}
