import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class Setup2FactorDto {
    @IsString()
    @ApiProperty({
        example: 'JohnDoe'
    })
    nickName: string

    @IsString()
    @ApiProperty({
        example: 'blue'
    })
    color: string

    @IsString()
    @ApiProperty({
        example: 'Greenwood High'
    })
    schoolName: string
}
