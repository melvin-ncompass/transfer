import { IsNotEmpty, IsEnum, IsString, IsNumberString, IsBoolean, IsOptional } from "class-validator";
import { DeductionFrequency } from "../entities/tenant.deductions.entity";

export class CreateDeductionsDto { 
    @IsNotEmpty()
    @IsEnum(DeductionFrequency)
    deductionFrequency: DeductionFrequency

    @IsNotEmpty()
    @IsString()
    deductionName: string
    
    @IsNotEmpty()
    @IsString()
    nameInPayslip: string

    @IsNotEmpty()
    @IsNumberString()
    amount: string

    @IsNotEmpty()
    @IsBoolean()
    isActive: boolean

    @IsOptional()
    @IsString()
    calculationType?: string
}