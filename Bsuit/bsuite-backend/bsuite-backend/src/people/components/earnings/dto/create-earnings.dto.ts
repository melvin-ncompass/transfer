import { CalculationType, EarningFrequency } from './../entities/tenant-earnings.entity';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, Length } from "class-validator";

export class CreateEarningsDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 100, { message: 'Earning name must be between 1 and 100 characters' })
    earningName: string

    @IsString()
    @IsNotEmpty()
    @Length(1, 100, { message: 'Name in payslip must be between 1 and 100 characters' })
    nameInPayslip: string

    @IsEnum(CalculationType)
    @IsString()
    calculationType: CalculationType

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsNotEmpty()
    amount: number

    @IsNumber()
    @IsOptional()
    percentageOf?: number 

    @IsEnum(EarningFrequency)
    @IsString()
    earningFrequency: EarningFrequency

    @IsBoolean()
    @IsNotEmpty()
    isActive: boolean

    @IsBoolean()
    @IsNotEmpty()
    taxExempt: boolean

    @IsBoolean()
    @IsNotEmpty()
    isProRataBasis: boolean
}