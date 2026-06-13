import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateTaxDto {
    @IsString()
    @MinLength(3, { message: 'Tax name must be at least 3 characters long' })
    @MaxLength(100, { message: 'Tax name must be at most 100 characters long' })
    @ApiProperty({ example: 'Central Goods and Service Tax' })
    taxName: string;

    @IsString()
    @MinLength(2, { message: 'Abbreviation must be at least 2 characters long' })
    @MaxLength(50, { message: 'Abbreviation must be at most 50 characters long' })
    @ApiProperty({ example: 'CGST' })
    abbreviation: string;

    @IsNumber()
    @Min(1, { message: 'Rate cannot be less than 1' })
    @Max(100, { message: 'Rate cannot be more than 100' })
    @ApiProperty({ example: '9' })
    taxRate: number;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ example: 'Optional Description of your choice' })
    description?: string | null;

    @IsNumber()
    @ApiProperty({ example: 'GST123' })
    taxNumber: number;
}
