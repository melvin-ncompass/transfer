import { IsBoolean, IsOptional } from "class-validator";

export class ZeroBalanceToggleDto {
  @IsBoolean()
  @IsOptional()
  reportZeroBalance: boolean = false;

  @IsBoolean()
  @IsOptional()
  accountZeroBalance: boolean = false;

  @IsBoolean()
  @IsOptional()
  reportDecimalPlace: boolean = false;
}
