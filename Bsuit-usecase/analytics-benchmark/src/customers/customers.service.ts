import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto, PaginatedCustomersDto } from './dto';

/**
 * Service for managing customer data.
 * Interacts directly with the PostgreSQL database.
 */
@Injectable()
export class CustomersService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * Retrieve all customers with pagination.
   * @param page - Page number.
   * @param limit - Items per page.
   */
  async findAll(page: number = 1, limit: number = 20): Promise<PaginatedCustomersDto> {
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query('SELECT COUNT(*) FROM customers');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await this.pool.query(
      'SELECT * FROM customers ORDER BY customer_id LIMIT $1 OFFSET $2',
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
   * Retrieve a single customer by ID.
   * @param id - Customer ID.
   */
  async findOne(id: number): Promise<CustomerResponseDto> {
    const result = await this.pool.query(
      'SELECT * FROM customers WHERE customer_id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Create a new customer.
   * @param createCustomerDto - Data for creating a customer.
   */
  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const { name, email } = createCustomerDto;
    
    const result = await this.pool.query(
      `INSERT INTO customers (name, email, created_at) 
       VALUES ($1, $2, NOW()) 
       RETURNING *`,
      [name, email],
    );

    return result.rows[0];
  }

  /**
   * Update an existing customer.
   * @param id - Customer ID.
   * @param updateCustomerDto - Data for updating a customer.
   */
  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const { name, email } = updateCustomerDto;
    
    const result = await this.pool.query(
      `UPDATE customers 
       SET name = COALESCE($1, name), email = COALESCE($2, email)
       WHERE customer_id = $3
       RETURNING *`,
      [name, email, id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return result.rows[0];
  }

  /**
   * Remove a customer by ID.
   * @param id - Customer ID.
   */
  async remove(id: number): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM customers WHERE customer_id = $1 RETURNING *',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
  }
}
