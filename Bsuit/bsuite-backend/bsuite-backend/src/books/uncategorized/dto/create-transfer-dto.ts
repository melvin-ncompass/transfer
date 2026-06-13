import { IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum TransferTargetType {
  ACCOUNT = 'account',
  CONTACT = 'contact',
  TAX = 'tax',
}

export class CreateTransferDto {
    @IsNumber()
    uncatId: number;

    @IsNumber()
    toAccountId: number;

    @IsOptional()
    @IsNumber()
    contactId: number;

    @IsEnum(TransferTargetType)
    toAccountType: TransferTargetType;
    
    @IsBoolean()
    hasTdsMapping: boolean;

    @IsOptional()
    contactMappingData: Record<string, any>;
}