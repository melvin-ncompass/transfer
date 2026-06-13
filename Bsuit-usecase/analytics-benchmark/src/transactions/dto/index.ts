import { IsString, IsNumber, IsOptional, IsNotEmpty, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  customer_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  merchant_id: number;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'completed', enum: ['completed', 'pending', 'failed', 'refunded', 'cancelled'] })
  @IsString()
  @IsOptional()
  @IsIn(['completed', 'pending', 'failed', 'refunded', 'cancelled'])
  status?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  customer_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  merchant_id?: number;

  @ApiPropertyOptional({ example: 99.99 })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 'completed', enum: ['completed', 'pending', 'failed', 'refunded', 'cancelled'] })
  @IsString()
  @IsOptional()
  @IsIn(['completed', 'pending', 'failed', 'refunded', 'cancelled'])
  status?: string;
}

export class TransactionResponseDto {
  @ApiProperty()
  transaction_id: number;

  @ApiProperty()
  customer_id: number;

  @ApiProperty()
  merchant_id: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  transaction_time: Date;
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

export class PaginatedTransactionsDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
