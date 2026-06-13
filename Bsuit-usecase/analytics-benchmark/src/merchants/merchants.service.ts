import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { CreateMerchantDto, UpdateMerchantDto, MerchantResponseDto, PaginatedMerchantsDto } from './dto';

/**
 * Service for managing merchant data.
 * Interacts directly with the PostgreSQL database.
 */
@Injectable()
export class MerchantsService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Retrieve all merchants with pagination.
   * @param page - Page number.
   * @param limit - Items per page.
   */
  async findAll(page: number = 1, limit: number = 20): Promise<PaginatedMerchantsDto> {
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query('SELECT COUNT(*) FROM merchants');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await this.pool.query(
      'SELECT * FROM merchants ORDER BY merchant_id LIMIT $1 OFFSET $2',
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
   * Retrieve a single merchant by ID.
   * @param id - Merchant ID.
   */
  async findOne(id: number): Promise<MerchantResponseDto> {
    const result = await this.pool.query(
      'SELECT * FROM merchants WHERE merchant_id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create a new merchant.
   * @param createMerchantDto - Data for creating a merchant.
   */
  async create(createMerchantDto: CreateMerchantDto): Promise<MerchantResponseDto> {
    const { merchant_name, category } = createMerchantDto;
    
    const result = await this.pool.query(
      `INSERT INTO merchants (merchant_name, category, created_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING *`,
      [merchant_name, category],
    );

    return result.rows[0];
  }

  /**
   * Update an existing merchant.
   * @param id - Merchant ID.
   * @param updateMerchantDto - Data for updating a merchant.
   */
  async update(id: number, updateMerchantDto: UpdateMerchantDto): Promise<MerchantResponseDto> {
    const { merchant_name, category } = updateMerchantDto;
    
    const result = await this.pool.query(
      `UPDATE merchants 
       SET merchant_name = COALESCE($1, merchant_name), category = COALESCE($2, category)
       WHERE merchant_id = $3
       RETURNING *`,
      [merchant_name, category, id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Remove a merchant by ID.
   * @param id - Merchant ID.
   */
  async remove(id: number): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM merchants WHERE merchant_id = $1 RETURNING *',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }
  }
}
