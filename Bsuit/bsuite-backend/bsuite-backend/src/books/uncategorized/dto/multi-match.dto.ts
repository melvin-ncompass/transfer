import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class MultiMatchItemDto {
  @IsNumber()
  @IsNotEmpty()
  uncategorizedId: number;

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

export class SaveUncategorizedMultiMatchDto {
  @ValidateNested({ each: true })
  @Type(() => MultiMatchItemDto)
  uncategorizedData: MultiMatchItemDto[];
}
