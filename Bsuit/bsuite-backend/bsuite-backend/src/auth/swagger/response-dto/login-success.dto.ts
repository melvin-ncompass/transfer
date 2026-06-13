import { ApiProperty } from '@nestjs/swagger';

export class LoginSuccessDto {
  @ApiProperty({ 
    description: 'JWT Access Token used for authenticated requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  accessToken: string;

  @ApiProperty({ 
    description: 'JWT Refresh Token stored in cookies and used to rotate access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  refreshToken: string;

  @ApiProperty({ 
    description: 'The unique identifier for the current session',
    example: 'd4a91543-052c-44f4-baec-c26f80910bad' 
  })
  sessionId: string;

  @ApiProperty({ 
    description: 'The unique username of the logged-in user',
    example: 'esufmj' 
  })
  username: string;

  @ApiProperty({ 
    description: 'Indicates if Two-Factor Authentication is currently enabled for this account',
    example: false 
  })
  twoFAEnabled: boolean;

  @ApiProperty({ 
    description: 'The ID of the user\'s primary/default company',
    example: '3RF2R0' 
  })
  defaultCompany: string;

  @ApiProperty({ 
    description: 'The display name of the user\'s primary/default company',
    example: 'arigato' 
  })
  defaultCompanyName: string;
}