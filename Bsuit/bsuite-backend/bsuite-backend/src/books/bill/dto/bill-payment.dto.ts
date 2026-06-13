import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class BillPaymentDto {
  @IsString()
  @IsOptional()
  paymentId?: string;

  @IsString()
  @IsNotEmpty()
  transactionTypeId: string;

  @IsNotEmpty()
  paymentAccountId: number;

  @IsDateString()
  paymentDate: string;

  @IsNumber()
  fxRate: number;

  @IsNumber()
  originalFxRate: number;

  @IsNumberString()
  paymentAmount: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Notes length cannot be more than 255' })
  notes?: string;

  @IsNumber()
  @IsOptional()
  accountToBillFXRate?: number;

  @IsNumber()
  @IsOptional()
  accountToBillOriginalFXRate?: number;

  @IsNumberString()
  @IsOptional()
  amountInAccCurr?: string;
}
