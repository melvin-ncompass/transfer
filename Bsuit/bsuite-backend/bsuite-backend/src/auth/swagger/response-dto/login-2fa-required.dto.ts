import { ApiProperty } from '@nestjs/swagger';

export class Login2FARequiredDto {
  @ApiProperty({ 
    description: 'Flag indicating that a second factor is required to complete login',
    example: true 
  })
  twoFARequired: boolean;

  @ApiProperty({ 
    description: 'List of enabled 2FA methods for this user',
    example: ['google', 'questions'],
    type: [String]
  })
  methods: string[];

  @ApiProperty({ 
    description: 'A short-lived temporary JWT used only to authenticate the subsequent 2FA verification request',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  tempToken: string;
}