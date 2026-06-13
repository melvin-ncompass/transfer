import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsNumberString } from 'class-validator';

export enum AmountType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export class UncategorizedMatchDto {
  @IsNotEmpty()
  @IsNumberString()
  amount: string;

  @IsNotEmpty()
  @IsEnum(AmountType, {
    message: 'Amount type must be either credit or debit',
  })
  amountType: AmountType;

  @IsNotEmpty()
  @Type(() => Number) 
  @IsNumber()
  uncategorizedId: number;
}
