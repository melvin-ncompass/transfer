import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  DiscountApplied,
  DiscountType,
  ApplyLevel,
  TdsType,
} from "src/common/enum/transact.enum";
import { CreateInvoiceItemDto } from "./create-invoice-item.dto";
import { CURRENCY_VALUES } from "src/common/config/currency.configs";

export class CreateInvoiceDto {
  @IsNumber()
  @IsOptional()
  invoiceId: number;

  @IsNotEmpty()
  contactId: number;

  @IsString()
  @IsNotEmpty()
  invoiceNo: string;

  @IsDateString()
  @IsNotEmpty()
  serviceStartDate: string;

  @IsDateString()
  @IsNotEmpty()
  serviceEndDate: string;

  @IsDateString()
  @IsNotEmpty()
  invoiceDate: string;

  @IsDateString()
  @IsNotEmpty()
  invoiceDueDate: string;

  @IsIn(CURRENCY_VALUES, {
    message:
      "Invoice currency must be in the format: CODE - SYMBOL, e.g., ₹ - INR",
  })
  invoiceCurrency: string;

  @IsNumber()
  @IsNotEmpty()
  fxRate: number;
                
  @IsNumber()
  @IsNotEmpty()
  originalFxRate: number;     

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Notes length cannot be more than 255' })
  notes?: string;

  @IsBoolean()
  hasTds: boolean;

  @ValidateIf((obj) => obj.hasTds === true)
  @IsNotEmpty({ message: "TDS Level is required when TDS is enabled" })
  @IsEnum(ApplyLevel, { message: "Invalid TDS level" })
  tdsLevel?: ApplyLevel;

  @ValidateIf((obj) => obj.hasTds === true && obj.tdsLevel === ApplyLevel.TOTAL)
  @IsNotEmpty({ message: "TDS Type is required when TDS level is TOTAL" })
  @IsEnum(TdsType, { message: "Invalid TDS type" })
  tdsType?: TdsType;

  @ValidateIf((obj) => obj.hasTds === true && obj.tdsLevel === ApplyLevel.TOTAL)
  @IsNotEmpty({ message: "TDS Value is required when TDS level is TOTAL" })
  @IsNumberString()
  tdsValue?: string;

  @ValidateIf((obj) => obj.hasTds === true )
  @IsNotEmpty({ message: "Total TDS value is required when TDS is enabled" })
  @IsNumberString()
  totalTdsValue?: string;

  @IsBoolean()
  hasDiscount: boolean;

  @ValidateIf((obj) => obj.hasDiscount === true)
  @IsNotEmpty({ message: "Discount value is required when discount is enabled" })
  @IsEnum(ApplyLevel, { message: "Invalid Discount level" })
  discountLevel?: ApplyLevel;

  @ValidateIf((obj) => obj.hasDiscount === true && obj.discountLevel === ApplyLevel.TOTAL)
  @IsNotEmpty({ message: "Discount applied level is required when discount level is TOTAL" })
  @IsEnum(DiscountApplied)
  discountApplied?: DiscountApplied;

  @ValidateIf((obj) => obj.hasDiscount === true && obj.discountLevel === ApplyLevel.TOTAL)
  @IsNotEmpty({ message: "Discount type is required when discount level is TOTAL" })
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ValidateIf((obj) => obj.hasDiscount === true && obj.discountLevel === ApplyLevel.TOTAL)
  @IsNotEmpty({ message: "Discount value is required when discount level is TOTAL" })
  @IsNumberString()
  discountValue?: string;

  @ValidateIf((obj) => obj.hasDiscount === true)
  @IsNotEmpty({ message: "Total Discount value is required when discount level is ITEM" })
  @IsNumberString()
  totalDiscountValue?: string;

  @ValidateIf((obj) => obj.hasDiscount === true && obj.discountLevel === ApplyLevel.TOTAL)
  @IsNotEmpty({ message: "Discount account is required when discount level is TOTAL" })
  discountAccountId?: number;

  @IsNumberString()
  invoiceTotal: string;

  @IsBoolean()
  isRoundOff: boolean;

  @ValidateIf((obj) => obj.isRoundOff === true)
  @IsNotEmpty({ message: "Roundoff Total is required when Roundoff is enabled" })
  @IsNumberString()
  roundoffTotal?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
