import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CsvMappingDto {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  accountType: string;

  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @IsString()
  @IsNotEmpty()
  accountCurrency: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  groupName?: string;

  @IsString()
  @IsOptional()
  parentAccount?: string;
}
