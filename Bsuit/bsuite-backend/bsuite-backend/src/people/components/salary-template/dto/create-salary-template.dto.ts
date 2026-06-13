import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NoDuplicateByKey } from '../decorator/duplicate-key.decorator';

class CreateSalaryTemplateEarningDto {
  @IsNumber()
  earningId: number;

  @IsString()
  monthlyAmount: string;

  @IsInt()
  payslipOrder: number;
}

class CreateSalaryTemplateDeductionDto {
  @IsNumber()
  deductionId: number;

  @IsString()
  monthlyAmount: string;

  @IsInt()
  payslipOrder: number;
}

export class CreateSalaryTemplateDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'templateName cannot be empty' })
  templateName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  annualGross: string;

  @IsString()
  monthlyGross: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalaryTemplateEarningDto)
  @NoDuplicateByKey('earningId', {
    message: 'Duplicate earningId found in earnings',
  })
  @NoDuplicateByKey('payslipOrder', {
    message: 'Duplicate payslipOrder found in earnings',
  })
  earnings: CreateSalaryTemplateEarningDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalaryTemplateDeductionDto)
    @NoDuplicateByKey('deductionId', {
    message: 'Duplicate deductionId found in deductions',
  })
  @NoDuplicateByKey('payslipOrder', {
    message: 'Duplicate payslipOrder found in deductions',
  })
  deductions: CreateSalaryTemplateDeductionDto[];
}


//  #======================= SAMPLE CREATE PAYLOAD =======================#

// {
//   "templateName": "Stipend 1",
//   // Required
//   // Trimmed, cannot be empty

//   "description": "Salary template for contract employees",
//   // Optional

//   "annualGross": "600000",
//   // Optional
//   // Numeric string

//   "monthlyGross": "50000",
//   // Optional
//   // Numeric string

//   "earnings": [
//     {
//       "earningId": 1,
//       // Required
//       // Must be unique in earnings

//       "monthlyAmount": "30000",
//       // Required
//       // Numeric string

//       "payslipOrder": 1
//       // Required
//       // Must be unique in earnings
//     },
//     {
//       "earningId": 2,
//       "monthlyAmount": "20000",
//       "payslipOrder": 2
//     }
//   ],
//   // Required
//   // At least 1 item

//   "deductions": [
//     {
//       "deductionId": 1,
//       // Required
//       // Must be unique in deductions

//       "monthlyAmount": "2000",
//       // Required
//       // Numeric string

//       "payslipOrder": 1
//       // Required
//       // Must be unique in deductions
//     },
//     {
//       "deductionId": 2,
//       "monthlyAmount": "1500",
//       "payslipOrder": 2
//     }
//   ]
//   // Optional
// }

