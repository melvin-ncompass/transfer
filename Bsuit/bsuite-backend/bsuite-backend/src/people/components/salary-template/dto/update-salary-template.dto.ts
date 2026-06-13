import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NoDuplicateByKey } from '../decorator/duplicate-key.decorator';

class UpdateSalaryTemplateEarningDto {
  /**
   * Existing SalaryTemplateEarnings row ID
   * If present → update
   * If absent → create new
   */
  @IsNumber()
  earningId: number;

  @IsString()
  monthlyAmount: string;

  @IsInt()
  payslipOrder: number;
}

class UpdateSalaryTemplateDeductionDto {
  @IsNumber()
  deductionId: number;

  @IsString()
  monthlyAmount: string;

  @IsInt()
  payslipOrder: number;
}

// overide
export class UpdateSalaryTemplateDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'templateName cannot be empty' })
  templateName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  annualGross?: string;

  @IsOptional()
  @IsString()
  monthlyGross?: string;

  /**
   * Upsert earnings
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSalaryTemplateEarningDto)
  @NoDuplicateByKey('earningId', {
    message: 'Duplicate earningId found in earnings',
  })
  @NoDuplicateByKey('payslipOrder', {
    message: 'Duplicate payslipOrder found in earnings',
  })
  earnings?: UpdateSalaryTemplateEarningDto[];

  /**
   * Upsert deductions
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSalaryTemplateDeductionDto)
  @NoDuplicateByKey('deductionId', {
    message: 'Duplicate deductionId found in deductions',
  })
  @NoDuplicateByKey('payslipOrder', {
    message: 'Duplicate payslipOrder found in deductions',
  })
  deductions?: UpdateSalaryTemplateDeductionDto[];
}

//  #=======================SAMPLE UPDATE PAYLOAD======================#

// {
//   "templateName": "Stipend 1",
//   // Optional
//   // Trimmed, must not be empty

//   "annualGross": "720000",
//   // Optional
//   // Numeric string

//   "monthlyGross": "60000",
//   // Optional
//   // Numeric string

//   "earnings": [
//     {
//       "earningId": 1,
//       // Required
//       // Must be unique in earnings

//       "monthlyAmount": "40000",
//       // Required
//       // Numeric string

//       "payslipOrder": 1
//       // Required
//       // Must be unique in earnings
//     }
//   ],
//   // Required
//   // At least 1 item

//   "deductions": [
//     {
//       "deductionId": 1,
//       // Required
//       // Must be unique in deductions

//       "monthlyAmount": "2500",
//       // Required
//       // Numeric string

//       "payslipOrder": 1
//       // Required
//       // Must be unique in deductions
//     }
//   ]
//   // Optional
// }
