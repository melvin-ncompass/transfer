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

export class CreateJournalDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalAccountDto)
  journalAccounts: JournalAccountDto[];

  @IsEnum([
    "journal",
    "transfer",
    "opening_balance"
  ])
  transactionTypeName:
    | "journal"
    | "transfer"
    | "opening_balance";

  @IsString()
  @IsOptional()
  @MaxLength(255)
  journalCurrency: string;

  @IsOptional()
  contactMappingData: Record<string, any>;
}
