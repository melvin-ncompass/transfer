import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from "class-validator";

export class InvoicePaymentDto {
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
  notes?: string;

  @IsNumber()
  @IsOptional()
  accountToInvoiceFXRate?: number;

  @IsNumber()
  @IsOptional()
  accountToInvoiceOriginalFXRate?: number;

  @IsNumberString()
  @IsOptional()
  amountInAccCurr?: string;
}
