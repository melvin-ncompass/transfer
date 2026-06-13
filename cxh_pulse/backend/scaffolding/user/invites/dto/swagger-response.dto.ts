import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsDateString, IsEmail, IsString, IsUUID } from "class-validator";
import { UserInfoDto } from '../../dto/swagger-response.dto'

export class InvitedByUserDto {
    @ApiProperty({
        type: String,
        example: 'name'
    })
    @IsString()
    name: string

    @ApiProperty({
        type: String,
        example: 'abc@gmail.com'
    })
    @IsEmail()
    email: string

    @ApiProperty({
        type: Number,
        example: 8364291234
    })
    phone: number
}
export class InvitedByDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: () => InvitedByUserDto
    })
    userInfo: InvitedByUserDto;
}
export class GetInvitesResponseDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: String,
        example: 'abcdefg'
    })
    @IsString()
    inviteTokenHash: string;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsString()
    invitedAt: string;

    @ApiProperty({
        type: () => InvitedByDto
    })
    invitedBy: InvitedByDto;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsString()
    inviteExpiry: string;

    @ApiProperty({
        type: Boolean,
        example: false
    })
    @IsBoolean()
    isAccepted: boolean;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    acceptedAt: string;

    @ApiProperty({
        type: Boolean,
        example: false
    })
    @IsBoolean()
    isAccountSetUp: boolean;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: string;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: string;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: string | null;

    @ApiProperty({
        type: () => UserInfoDto
    })
    userInfo: UserInfoDto;
}

export class InviteResponseDto {
    @ApiProperty({
        type: String,
        example: 'abc@gmail.com'
    })
    @IsEmail()
    email: string

    @ApiProperty({
        type: String,
        example: 'name'
    })
    @IsString()
    name: string

    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    userInfoId: string;

    @ApiProperty({
        type: Array,
        example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '1234c384-fddh-4a13-80cd-1cbd1ef95ba8']
    })
    @IsArray()
    @IsString({ each: true })
    roleIds: string[]
}

export class PasswordDto{
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: String,
        example: 'abcd12'
    })
    @IsString()
    password: string

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: string;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: string;


}
export class OnboardResponseDto{
    @ApiProperty({
        type:()=>UserInfoDto
    })
    userInfo:UserInfoDto

    @ApiProperty({
        type:()=>PasswordDto
    })
    password:PasswordDto

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
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: string;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: string;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: string | null;
}