import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  ValidateNested,
} from "class-validator";
import { AccountTypeReport } from "src/common/enum/account-type.enum";
class ReportRepositionDto {
  @IsInt()
  @IsNotEmpty()
  id: number;
  @IsInt()
  @IsNotEmpty()
  position: number;
  @IsEnum(AccountTypeReport, {
    message:
      "accountType must be a from Asset, Liability, Income, Expense, Contact",
  })
  accountType: AccountTypeReport;
}
export class ReportRepositionArray {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportRepositionDto)
  reportRepositionArray: ReportRepositionDto[];
}
