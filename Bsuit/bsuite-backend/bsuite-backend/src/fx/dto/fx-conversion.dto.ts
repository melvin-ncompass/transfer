import { IsString, IsNumber, Matches, Min, IsDateString } from 'class-validator';

export class FxConversionDto {
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  from: string;

  @IsString()
  @Matches(/^[A-Z]{3}$/)
  to: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  date: string;
}