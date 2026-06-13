import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import type { Product, CreateProductDto } from '../interfaces/product.interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts(): Promise<{ products: Product[]; total: number; skip: number; limit: number }> {
    return this.productsService.getAllProducts();
  }

  @Get('search')
  async searchProducts(@Query('q') query: string): Promise<{ products: Product[]; total: number; skip: number; limit: number }> {
    return this.productsService.searchProducts(query);
  }

  @Get(':id')
  async getProductById(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.getProductById(id);
  }

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.createProduct(createProductDto);
  }

  @Put(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: Partial<CreateProductDto>,
  ): Promise<Product> {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<{ isDeleted: boolean; deletedProduct: Product }> {
    return this.productsService.deleteProduct(id);
  }
}