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
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto, PaginatedCustomersDto } from './dto';

/**
 * Controller for managing customer resources.
 * Provides CRUD operations for customers.
 */
@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * Get all customers with pagination.
   * @param page - Page number (default: 1).
   * @param limit - Items per page (default: 20).
   */
  @Get()
  @ApiOperation({ summary: 'Get all customers (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns paginated customers', type: PaginatedCustomersDto })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedCustomersDto> {
    return this.customersService.findAll(page, limit);
  }

  /**
   * Get a specific customer by ID.
   * @param id - Customer ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Returns the customer', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CustomerResponseDto> {
    return this.customersService.findOne(id);
  }

  /**
   * Create a new customer.
   * @param createCustomerDto - Customer creation data.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully', type: CustomerResponseDto })
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    return this.customersService.create(createCustomerDto);
  }

  /**
   * Update an existing customer.
   * @param id - Customer ID.
   * @param updateCustomerDto - Customer update data.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, updateCustomerDto);
  }

  /**
   * Delete a customer.
   * @param id - Customer ID.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.customersService.remove(id);
    return { message: 'Customer deleted successfully' };
  }
}
