import { IsString, Matches, IsDateString } from 'class-validator';

export class FxRateDto {
  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^[A-Z]{3}(,[A-Z]{3})*$/)
  from: string;


  @IsString()
  @Matches(/^[A-Z]{3}$/)
  to: string;
}