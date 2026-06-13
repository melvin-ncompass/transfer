import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class JournalAccountDto {
  @IsNumber()
  id: number;

  @IsString()
  @IsOptional()
  @MaxLength(12)
  transactionTypeId: string;

  @IsIn(["Account", "Contact", "Tax"])
  type: "Account" | "Contact" | "Tax";

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  credit: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  debit: number;

  @IsBoolean()
  isFromAccount: boolean;
}

export class UpdateJournalDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsDateString()
  date: string;

  @IsEnum([
    "journal",
    "transfer",
    "invoice",
    "bill",
    "invoice_payment",
    "bill_payment",
    "opening_balance"
  ])
  transactionTypeName:
    | "journal"
    | "transfer"
    | "invoice"
    | "bill"
    | "invoice_payment"
    | "bill_payment"
    | "opening_balance"

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalAccountDto)
  journalAccounts: JournalAccountDto[];

  @IsOptional()
  contactMappingData: Record<string, any>;
}
