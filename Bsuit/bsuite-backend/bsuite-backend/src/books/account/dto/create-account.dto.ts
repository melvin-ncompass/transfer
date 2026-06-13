import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength, IsNotEmpty, IsPositive } from 'class-validator';
import { AccountType } from 'src/common/enum/account-type.enum';
import { CurrencyEnum } from 'src/common/enum/currency.enum';

export class CreateAccountDataDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  accountName: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountCode: string;

  @IsEnum(CurrencyEnum, {
    message: "Account currency must be a valid currency code",
  })
  accountCurrency: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsPositive()
  parentAccountId?: number;

  @IsOptional()
  @IsPositive()
  groupId?: number;
}
