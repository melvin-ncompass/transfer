// src/company-settings/dto/update-company-setting.dto.ts
import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { CommaSeparation } from '../entities/tenant.company-setting.entity';

export class UpdateReportStructureDto {
    @IsOptional()
    @IsNumber()
    fiscalYearStartDate?: number;

    @IsOptional()
    @IsString()
    fiscalYearStartMonth?: string;

    @IsOptional()
    @IsNumber()
    fiscalYearEndDate?: number;

    @IsOptional()
    @IsString()
    fiscalYearEndMonth?: string;

    @IsOptional()
    @IsBoolean()
    enableFxCorrection?: boolean;

    @IsOptional()
    @IsBoolean()
    isCompanyName?: boolean;

    @IsOptional()
    @IsBoolean()
    isHeaderImage?: boolean;

    @IsOptional()
    @IsBoolean()
    isPageNumber?: boolean;

    @IsOptional()
    @IsBoolean()
    isGeneratedBy?: boolean;

    @IsOptional()
    @IsBoolean()
    isGeneratedDate?: boolean;

    @IsOptional()
    @IsBoolean()
    isGeneratedTime?: boolean;

    @IsOptional()
    @IsString()
    footerContent?: string;

    @IsEnum(CommaSeparation)
    commaSeparation: CommaSeparation;
}
