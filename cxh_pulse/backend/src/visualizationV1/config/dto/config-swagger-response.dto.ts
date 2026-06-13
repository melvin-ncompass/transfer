import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsDateString } from 'class-validator';
export class BizConfigDto{
    @ApiProperty({
        type:Number,
        example:25
    })
    @IsNumber()
    temperatureThreshold:number 

    @ApiProperty({
        type:Number,
        example:10
    })
    @IsNumber()
    precipitationThreshold:number
}
export class ConfigResponseDto{
    @ApiProperty({
        type:String,
        example:'abc'
    })
    @IsString()
    id:string

    @ApiProperty({
        type:String,
        example:'config'
    })
    @IsString()
    name:string 

    @ApiProperty({
        type:[BizConfigDto]
    })
    @IsArray()
    config:BizConfigDto[]

    @ApiProperty({
        type:Date,
        example:'2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    createdAt:Date

     @ApiProperty({
        type:Date,
        example:'2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    updatedAt:Date

     @ApiProperty({
        type:Date,
        example:'2025-12-17T12:09:06.760Z'
    })
    @IsDateString()
    deletedAt:Date
}