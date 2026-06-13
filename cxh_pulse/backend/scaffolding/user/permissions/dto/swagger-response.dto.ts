import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';
export class SystemPermissionsResponseDto {
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
        example: 'Allow managing accounts'
    })
    @IsString()
    description: string

    @ApiProperty({
        type: Boolean,
        example: false
    })
    @IsString()
    enabled: boolean

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
}

export class BusinessPermissionsResponseDto {
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
        example: 'Allow managing accounts'
    })
    @IsString()
    description: string

    @ApiProperty({
        type: String,
        format: 'uuid',
        example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'
    })
    @IsUUID()
    parentId: string;

    @ApiProperty({
        type: Boolean,
        example: false
    })
    @IsString()
    enabled: boolean

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
        type: [BusinessPermissionsResponseDto],
        nullable: true
    })
    children: BusinessPermissionsResponseDto[] | null

}
export class GetPermissionResponseDto {
    @ApiProperty({
        type: [SystemPermissionsResponseDto]
    })
    system: SystemPermissionsResponseDto[]

    @ApiProperty({
        type: [BusinessPermissionsResponseDto]
    })
    business: BusinessPermissionsResponseDto[]
}