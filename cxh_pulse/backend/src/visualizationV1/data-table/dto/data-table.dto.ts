import { IsOptional, IsInt, IsString, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DataTableFilterDto {
    // @IsOptional()
    @ApiProperty({
        type: Number,
        required: false
    })
    @Type(() => Number)
    @IsInt()
    startYear?: number;

    // @IsOptional()
    @ApiProperty({
        type: Number,
        required: false
    })
    @Type(() => Number)
    @IsInt()
    endYear?: number;

    // @IsOptional()
    @ApiProperty({
        type: Number,
        minimum: 1,
        maximum: 12,
        required: false
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    startMonth?: number;

    // @IsOptional()
    @ApiProperty({
        type: Number,
        minimum: 1,
        maximum: 12,
        required: false
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    endMonth?: number;

    @ApiProperty({
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    subcounty?: string;

    @ApiProperty({
        type: String,
        required: false
    })
    @IsOptional()
    @IsString()
    ward?: string;
}

export class DataTableResponseDto {
    @ApiProperty({
        type: String,
        example: 'efg',
    })
    @IsString()
    ward: string

    @ApiProperty({
        type: String,
        example: 'abc',
    })
    @IsString()
    subcounty: string

    @ApiProperty({
        type: Number,
        example: 29.9
    })
    @IsNumber()
    avgTemp: number

    @ApiProperty({
        type: Number,
        example: 10.2
    })
    @IsNumber()
    precip: number

    @ApiProperty({
        type: Number,
        example: 2
    })
    @IsNumber()
    maternalMortality: number

    @ApiProperty({
        type: Number,
        example: 20
    })
    @IsNumber()
    malariaCases: number

    @ApiProperty({
        type: Number,
        example: 2019
    })
    @IsNumber()
    year: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    month: number

}