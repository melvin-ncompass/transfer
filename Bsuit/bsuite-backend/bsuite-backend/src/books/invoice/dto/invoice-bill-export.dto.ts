import { IsEnum, IsDateString, IsNotEmpty } from 'class-validator';

export enum EntityType {
  INVOICE = 'INVOICE',
  BILL = 'BILL',
}

export enum ExportType {
  PDF = 'pdf',
  EXCEL = 'excel',
}

export class ExportQueryDto {
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;

  @IsEnum(ExportType)
  @IsNotEmpty()
  exportType: ExportType;

  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @IsDateString()
  @IsNotEmpty()
  toDate: string;
}