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
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto, UpdateMerchantDto, MerchantResponseDto, PaginatedMerchantsDto } from './dto';

/**
 * Controller for managing merchant resources.
 * Provides CRUD operations for merchants.
 */
@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  /**
   * Get all merchants with pagination.
   * @param page - Page number (default: 1).
   * @param limit - Items per page (default: 20).
   */
  @Get()
  @ApiOperation({ summary: 'Get all merchants (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns paginated merchants', type: PaginatedMerchantsDto })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedMerchantsDto> {
    return this.merchantsService.findAll(page, limit);
  }

  /**
   * Get a specific merchant by ID.
   * @param id - Merchant ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get merchant by ID' })
  @ApiResponse({ status: 200, description: 'Returns the merchant', type: MerchantResponseDto })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MerchantResponseDto> {
    return this.merchantsService.findOne(id);
  }

  /**
   * Create a new merchant.
   * @param createMerchantDto - Merchant creation data.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new merchant' })
  @ApiResponse({ status: 201, description: 'Merchant created successfully', type: MerchantResponseDto })
  async create(@Body() createMerchantDto: CreateMerchantDto): Promise<MerchantResponseDto> {
    return this.merchantsService.create(createMerchantDto);
  }

  /**
   * Update an existing merchant.
   * @param id - Merchant ID.
   * @param updateMerchantDto - Merchant update data.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a merchant' })
  @ApiResponse({ status: 200, description: 'Merchant updated successfully', type: MerchantResponseDto })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMerchantDto: UpdateMerchantDto,
  ): Promise<MerchantResponseDto> {
    return this.merchantsService.update(id, updateMerchantDto);
  }

  /**
   * Delete a merchant.
   * @param id - Merchant ID.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a merchant' })
  @ApiResponse({ status: 200, description: 'Merchant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.merchantsService.remove(id);
    return { message: 'Merchant deleted successfully' };
  }
}
