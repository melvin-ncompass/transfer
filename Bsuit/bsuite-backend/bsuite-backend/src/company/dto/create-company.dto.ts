import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { CURRENCY_VALUES } from '../../common/config/currency.configs';

export class CreateCompanyDto {
  @IsString()
  @Length(3, 100, { message: 'Company name must be between 3 and 100 characters' })
  companyName: string;
  
  @IsString()
  @Length(1, 20, { message: 'Company Short name must be between 1 and 20 characters' })
  companyShortName: string;

  @IsIn(CURRENCY_VALUES)
  reportingCurrency: string;
}
