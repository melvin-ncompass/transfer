import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateCompanyImageDto {
  @IsString()
  companyName: string;

  @IsString()
  companyShortName: string;

  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  x1?: number;

  @IsOptional()
  @IsNumber()
  y1?: number;

  @IsOptional()
  @IsNumber()
  width1?: number;

  @IsOptional()
  @IsNumber()
  height1?: number;

  @IsOptional()
  @IsString()
  removeLogo?: string;

  @IsOptional()
  @IsString()
  removeHeaderImage?: string;
}