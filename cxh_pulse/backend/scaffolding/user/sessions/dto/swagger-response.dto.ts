import { IsBoolean, IsDateString } from 'class-validator';
import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from 'scaffolding/user/dto/swagger-response.dto';
export class UserResponseDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: Boolean,
        example: false
    })
    @IsBoolean()
    isArchived: boolean;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
    })
    @IsDateString()
    createdAt: Date 

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    updatedAt: Date | null

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    deletedAt: Date | null

    @ApiProperty({
        type: () => UserInfoDto
    })
    userInfo: UserInfoDto
}
export class SessionLogResponseDto{
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    sessionId: string;

     @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    sessionInitiatedAt: Date 

     @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    sessionLogoutAt: Date | null

     @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    expiresAt: Date | null

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
  
    })
    @IsDateString()
    createdAt: Date 

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    updatedAt: Date | null

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    deletedAt: Date | null


}
export class UserLogResponseDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: String,
        example: '/visualization/'
    })
    @IsString()
    endpoint: string

    @ApiProperty({
        type: String,
        example: 'GET'
    })
    @IsString()
    method: string

    @ApiProperty({
        type: String,
        nullable: true
    })
    @IsString()
    requestBody: string | null

    @ApiProperty({
        type: String,
        example: '200'
    })
    @IsString()
    responseStatus: string

    @ApiProperty({
        type: String,
        example: 'Mozilla/5.0'
    })
    @IsString()
    userAgent: string

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
    })
    @IsDateString()
    createdAt: Date 

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    updatedAt: Date | null

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    deletedAt: Date | null

    @ApiProperty({
        type: () => UserResponseDto
    })
    user: UserResponseDto

    @ApiProperty({
        type: () => SessionLogResponseDto
    })
    session: SessionLogResponseDto

}