import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsString, IsUUID, IsBoolean, IsArray, IsEmail } from "class-validator"
import { UserInfoDto } from "scaffolding/user/dto/swagger-response.dto"

export class CreateUserRequestResponseDto {
    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
    })
    @IsDateString()
    requestedAt: Date

    @ApiProperty({
        type: String,
        example: 'safryy'
    })
    @IsString()
    password: string

    @ApiProperty({
        type: String,
        example: 'pending'
    })
    @IsString()
    status: 'pending' | 'approved' | 'denied'

    @ApiProperty({
        type: () => UserInfoDto
    })
    userInfo: UserInfoDto

    @ApiProperty({
        type: String,
        example: 'ajdbhejh',
    })
    @IsString()
    requestTokenHash: string
    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
    })
    @IsDateString()
    requestTokenExpiry: Date

    @ApiProperty({
        type: String,
    })
    @IsString()
    processedBy: string

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    processedAt: Date | null

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
    isAccountSetUp: boolean;

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

export class GetUserRequestResponseDto{
    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    id: string;

     @ApiProperty({
        type: String,
        example: 'ajdbhejh',
    })
    @IsString()
    requestTokenHash: string

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
    })
    @IsDateString()
    requestTokenExpiry: Date

     @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
    })
    @IsDateString()
    requestedAt: Date

     @ApiProperty({
        type: String,
        example: 'ajdbhejh',
    })
    @IsString()
    password: string

     @ApiProperty({
        type: String,
    })
    @IsString()
    processedBy: string

    @ApiProperty({
        type: Date,
        example: '2025-12-17T12:09:06.760Z',
        nullable: true
    })
    @IsDateString()
    processedAt: Date | null

    @ApiProperty({
        type: String,
        example: 'pending'
    })
    @IsString()
    status: 'pending' | 'approved' | 'denied'

    @ApiProperty({
        type: Boolean,
        example: false
    })
    @IsBoolean()
    isAccountSetUp: boolean;

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

export class ProcessUserResponseDto{
     @ApiProperty({
        type: String,
        example:'Request processed'
    })
    @IsString()
    msg: string

     @ApiProperty({
        type: String,
        example:"abc@gmail.com"
    })
    @IsEmail()
    email: string

     @ApiProperty({
        type: String,
        example:"name"
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
        type:[String],
        example:["mdgrsfbsk"]
    })
    @IsArray()
    @IsString({each:true})
    roleIds:string[]
}