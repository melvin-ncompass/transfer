import { ApiProperty } from '@nestjs/swagger';

export class TokenRotationDto {
  @ApiProperty({ example: 'new_access_token' })
  accessToken: string;

  @ApiProperty({ example: 'new_refresh_token' })
  refreshToken: string;

  @ApiProperty({ example: 'uuid-session-id' })
  sessionId: string;
  
  @ApiProperty({ example: '3RF2R0' })
  defaultCompany: string;
}