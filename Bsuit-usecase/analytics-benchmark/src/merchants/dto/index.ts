import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMerchantDto {
  @ApiProperty({ example: 'Super Mart ABC' })
  @IsString()
  @IsNotEmpty()
  merchant_name: string;

  @ApiProperty({ example: 'Grocery' })
  @IsString()
  @IsNotEmpty()
  category: string;
}

export class UpdateMerchantDto {
  @ApiPropertyOptional({ example: 'Super Mart ABC' })
  @IsString()
  @IsOptional()
  merchant_name?: string;

  @ApiPropertyOptional({ example: 'Grocery' })
  @IsString()
  @IsOptional()
  category?: string;
}

export class MerchantResponseDto {
  @ApiProperty()
  merchant_id: number;

  @ApiProperty()
  merchant_name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  created_at: Date;
}

export class PaginationMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedMerchantsDto {
  @ApiProperty({ type: [MerchantResponseDto] })
  data: MerchantResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
