import {
  IsOptional,
  IsString,
  IsNumberString,
  IsDateString,
  IsInt,
  Min,
  IsNotEmpty,
  ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";

export class GetAllTransactionsDto {
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;

  @IsOptional()
  filter?: string | string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  limit?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ValidateIf((obj) => obj.accountType !== "all")
  accountId: number;

  @IsString()
  @IsNotEmpty()
  accountType: string;

  @IsOptional()
  @IsString()
  exportType?: string;

  @IsOptional()
  @IsString()
  prevCursor?: string;

  @IsOptional()
  @IsString()
  nextCursor?: string;

  @IsOptional()
  @IsString()
  newTransactionId?: string

  @IsOptional()
  @IsString()
  newTransactionName?: string

  @IsOptional()
  @IsString()
  newPaymentId?: string
}
