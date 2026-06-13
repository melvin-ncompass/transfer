import { IsString, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';

export class CreateInvoiceTemplateDto {
  @IsString()
  templateName: string;

  @IsObject()
  @IsOptional()
  header?: Record<string, any>;

  @IsObject()
  @IsOptional()
  footer?: Record<string, any>;

  @IsObject()
  @IsOptional()
  transactionDetails?: Record<string, any>;

  @IsObject()
  @IsOptional()
  table?: Record<string, any>;

  @IsOptional()
  @IsArray()
  total?: Array<{ key: string; value: any }>;

  @IsOptional()
  @IsObject()
  otherDetails?: {
    showBankDetails?: boolean;
    bankDetails?: Record<string, any>;
    showIdentity?: boolean;
    identityFields?: Array<Record<string, any>>;
  };
}
