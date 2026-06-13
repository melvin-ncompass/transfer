import { IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString } from "class-validator";
import { TdsType } from "src/common/enum/transact.enum";

export class CreateInvoiceItemDto {
  @IsNumber()
  @IsOptional()
  itemId: number;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsNotEmpty()
  
  itemAccountId: number;

  @IsOptional()
  @IsString()
  hsnSac?: string;

  @IsNumberString()
  quantity: string;

  @IsNumberString()
  unitPrice: string;

  @IsNumberString()
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
