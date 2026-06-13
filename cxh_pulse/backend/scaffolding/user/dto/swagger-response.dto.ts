import { ApiProperty } from "@nestjs/swagger"
import { IsUUID, IsString, IsEmail, IsArray, IsDateString, IsNumber, IsBoolean } from "class-validator";

export class RoleDetailsDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: String,
        example: 'name'
    })
    @IsString()
    name: string

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date
}
export class UserInfoResponseDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

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

    @ApiProperty({
        type: String,
        example: 'abc.jpg'
    })
    @IsEmail()
    profilePicId: string

    @ApiProperty({
        type: Array,
        example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8']
    })
    @IsArray()
    @IsString({ each: true })
    roleIds: string[]

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date

    @ApiProperty({
        type: [RoleDetailsDto]
    })
    @IsArray()
    roleDetails: RoleDetailsDto[]
}
export class CreateUserResponseDto {
    @ApiProperty({
        type: [UserInfoResponseDto]
    })
    @IsArray()
    userInfo: UserInfoResponseDto[]

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
    @IsString()
    isArchived: boolean

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date
}
export class UserInfoDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

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

    @ApiProperty({
        type: String,
        example: 'abc.jpg'
    })
    @IsEmail()
    profilePicId: string

    @ApiProperty({
        type: Array,
        example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '1234c384-fddh-4a13-80cd-1cbd1ef95ba8']
    })
    @IsArray()
    @IsString({ each: true })
    roleIds: string[]

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date
}
export class RoleDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: String,
        example: 'name'
    })
    @IsString()
    name: string

    @ApiProperty({
        type: Boolean,
        example: false
    })
    @IsString()
    isDefault: boolean

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date
}

export class RoleMappingDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date

    @ApiProperty({
        type: () => RoleDto,
    })
    role: RoleDto;
}
export class GetUsersPaginatedResponseDto {
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
    @IsString()
    isArchived: boolean

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date

    @ApiProperty({
        type: () => UserInfoDto
    })
    @IsArray()
    userInfo: UserInfoDto

    @ApiProperty({
        type: [RoleMappingDto]
    })
    @IsArray()
    roleMappings: RoleMappingDto[]

    @ApiProperty({
        type: Number,
        example: 10
    })
    @IsNumber()
    total: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    page: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    limit: number

    @ApiProperty({
        type: Number,
        example: 10
    })
    @IsNumber()
    lastPage: number
}

export class GetUsersNonPaginatedResponseDto {
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
    @IsString()
    isArchived: boolean

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date

    @ApiProperty({
        type: () => UserInfoDto
    })
    @IsArray()
    userInfo: UserInfoDto

    @ApiProperty({
        type: [RoleMappingDto]
    })
    @IsArray()
    roleMappings: RoleMappingDto[]

    @ApiProperty({
        type: Number,
        example: 10
    })
    @IsNumber()
    total: number

}

export class BaseMemberDto {

    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsString()
    id: string;

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

export class UserInfoForUserDto {

    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

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

    @ApiProperty({
        type: String,
        example: 'abc.jpg'
    })
    @IsEmail()
    profilePicId: string

    @ApiProperty({
        type: Array,
        example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8']
    })
    @IsArray()
    @IsString({ each: true })
    roleIds: string[]

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt: Date

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt: Date

    @ApiProperty({
        type: [RoleDetailsDto]
    })
    @IsArray()
    roles: RoleDetailsDto[]
}

export class UserMemberDto extends BaseMemberDto {

    @ApiProperty({
        type: Boolean,
        example: false
    })
    isArchived: boolean;

    @ApiProperty({
        type: () => UserInfoForUserDto
    })
    userInfo: UserInfoForUserDto;

    @ApiProperty({
        type: [RoleMappingDto]
    })
    roleMappings: RoleMappingDto[];

    @ApiProperty({
        example: 'user'
    })
    type: 'user'
}

export class InviteMemberDto extends BaseMemberDto {
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
        type: () => UserInfoForUserDto
    })
    userInfo: UserInfoForUserDto;

    @ApiProperty({
        type:Boolean,
        example:false
    })
    @IsBoolean()
    isExpired:boolean
    
    @ApiProperty({
        example: 'invite'
    })
    type: 'invite'
}

export class RequestMemberDto extends BaseMemberDto {
    @ApiProperty({
        type: String,
        example: 'pending'
    })
    @IsString()
    status: 'pending' | 'approved' | 'rejected';

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
    })
    @IsString()
    requestedAt: string;

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    processedAt: string | null;

    @ApiProperty({
        type: String,
        example: 'abc',
        nullable: true
    })
    @IsString()
    processedBy: string | null;

    @ApiProperty({
        type: () => UserInfoForUserDto
    })
    userInfo: UserInfoForUserDto;

    @ApiProperty({
        example: 'request'
    })
    type: 'request'
}
export class DeletedCountDto {
    @ApiProperty({
        type: Number,
        example: 1
    })
    users: number

    @ApiProperty({
        type: Number,
        example: 0
    })
    invites: number

    @ApiProperty({
        type: Number,
        example: 0
    })
    requests: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    total: number
}
export class HardDeleteUserResponseDto {
    @ApiProperty({
        type: String,
        example: 'Successfully hard-deleted 1 users, 0 invites, and 0 requests'
    })
    @IsString()
    message: string

    @ApiProperty({
        type: () => DeletedCountDto
    })
    deletedCount: DeletedCountDto;

    @ApiProperty({
        type: Array,
        example: ['abc@gmail.com']
    })
    @IsArray()
    @IsString({ each: true })
    deletedEmails: string[]
}