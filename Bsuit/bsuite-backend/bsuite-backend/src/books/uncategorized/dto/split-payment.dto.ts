import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class SplitDataItemDto {
  @IsNumberString()
  @IsNotEmpty()
  transactionTypeId: string;

  @IsNumber()
  @IsNotEmpty()
  fxRate: number;

  @IsNumber()
  @IsNotEmpty()
  originalFxRate: number;

  @IsNumberString()
  @IsNotEmpty()
  convertedAmount: string;

  @IsNumberString()
  @IsNotEmpty()
  amountInAccCurr: string;
}

export class SaveUncategorizedMatchDto {
  @ValidateNested({ each: true })
  @Type(() => SplitDataItemDto)
  splitData: SplitDataItemDto[];
}
