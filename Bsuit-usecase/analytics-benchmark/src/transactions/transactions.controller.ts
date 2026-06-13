import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionResponseDto, PaginatedTransactionsDto } from './dto';

/**
 * Controller for managing transaction resources.
 * Provides CRUD operations for transactions.
 */
@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Get all transactions with pagination.
   * @param page - Page number (default: 1).
   * @param limit - Items per page (default: 20).
   */
  @Get()
  @ApiOperation({ summary: 'Get all transactions (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns paginated transactions', type: PaginatedTransactionsDto })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedTransactionsDto> {
    return this.transactionsService.findAll(page, limit);
  }

  /**
   * Get a specific transaction by ID.
   * @param id - Transaction ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Returns the transaction', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(id);
  }

  /**
   * Create a new transaction.
   * @param createTransactionDto - Transaction creation data.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully', type: TransactionResponseDto })
  async create(@Body() createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto> {
    return this.transactionsService.create(createTransactionDto);
  }

  /**
   * Update an existing transaction.
   * @param id - Transaction ID.
   * @param updateTransactionDto - Transaction update data.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  /**
   * Delete a transaction.
   * @param id - Transaction ID.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.transactionsService.remove(id);
    return { message: 'Transaction deleted successfully' };
  }
}
