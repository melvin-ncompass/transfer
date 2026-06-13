import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { CreateTransactionDto, UpdateTransactionDto, TransactionResponseDto, PaginatedTransactionsDto } from './dto';

/**
 * Service for managing transaction data.
 * Interacts directly with the PostgreSQL database.
 */
@Injectable()
export class TransactionsService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Retrieve all transactions with pagination.
   * @param page - Page number.
   * @param limit - Items per page.
   */
  async findAll(page: number = 1, limit: number = 20): Promise<PaginatedTransactionsDto> {
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query('SELECT COUNT(*) FROM transactions');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await this.pool.query(
      'SELECT * FROM transactions ORDER BY transaction_id DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );

    return {
      data: result.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve a single transaction by ID.
   * @param id - Transaction ID.
   */
  async findOne(id: number): Promise<TransactionResponseDto> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create a new transaction.
   * @param createTransactionDto - Data for creating a transaction.
   */
  async create(createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto> {
    const { customer_id, merchant_id, amount, status } = createTransactionDto;
    
    const result = await this.pool.query(
      `INSERT INTO transactions (customer_id, merchant_id, amount, status, transaction_time) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [customer_id, merchant_id, amount, status || 'completed'],
    );

    return result.rows[0];
  }

  /**
   * Update an existing transaction.
   * @param id - Transaction ID.
   * @param updateTransactionDto - Data for updating a transaction.
   */
  async update(id: number, updateTransactionDto: UpdateTransactionDto): Promise<TransactionResponseDto> {
    const { customer_id, merchant_id, amount, status } = updateTransactionDto;
    
    const result = await this.pool.query(
      `UPDATE transactions 
       SET customer_id = COALESCE($1, customer_id), 
           merchant_id = COALESCE($2, merchant_id),
           amount = COALESCE($3, amount),
           status = COALESCE($4, status)
       WHERE transaction_id = $5
       RETURNING *`,
      [customer_id, merchant_id, amount, status, id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Remove a transaction by ID.
   * @param id - Transaction ID.
   */
  async remove(id: number): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM transactions WHERE transaction_id = $1 RETURNING *',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
  }
}
