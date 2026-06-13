import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { TdsType } from "src/common/enum/transact.enum";

export class BillItemDto {
  @IsNumber()
  @IsOptional()
  itemId: number;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsNumber()
  @IsNotEmpty()
  itemAccountId: number;

  @IsOptional()
  @IsString()
  hsnSac?: string;

  @IsNumberString()
  @IsNotEmpty()
  quantity: string;

  @IsNumberString()
  @IsNotEmpty()
  unitPrice: string;

  @IsNumberString()
  @IsNotEmpty()
  itemTotal: string;

  @IsOptional()
  @IsNumberString()
  itemTdsValue?: string;

  @IsOptional()
  @IsEnum(TdsType)
  itemTdsType?: TdsType;

  @IsOptional()
  itemTax?: {
    taxId: number;
    isOverride: boolean;
    type: string;
    value: number;
  }[];
}
