import { ApiProperty } from "@nestjs/swagger"
import { IsNumber } from "class-validator"

export class Verify2FactorDto {
    @IsNumber()
    @ApiProperty({
        example: 123456
    })
    code: number
}
