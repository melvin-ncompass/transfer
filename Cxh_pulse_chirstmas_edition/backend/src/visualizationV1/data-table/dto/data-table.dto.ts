import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DataTableFilterDto {
    // @IsOptional()
    @Type(() => Number)
    @IsInt()
    startYear?: number;

    // @IsOptional()
    @Type(() => Number)
    @IsInt()
    endYear?: number;

    // @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    startMonth?: number;

    // @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    endMonth?: number;

    @IsOptional()
    @IsString()
    subcounty?: string;

    @IsOptional()
    @IsString()
    ward?: string;
}