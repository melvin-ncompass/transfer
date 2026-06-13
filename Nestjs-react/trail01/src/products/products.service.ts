import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Product, CreateProductDto } from '../interfaces/product.interface';

@Injectable()
export class ProductsService {
  private readonly baseUrl = 'https://dummyjson.com/products';

  async getAllProducts(): Promise<{ products: Product[]; total: number; skip: number; limit: number }> {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProductById(id: number): Promise<Product> {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException(
          `Product with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Failed to fetch product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const response = await axios.post(`${this.baseUrl}/add`, createProductDto, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to create product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateProduct(id: number, updateProductDto: Partial<CreateProductDto>): Promise<Product> {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, updateProductDto, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException(
          `Product with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Failed to update product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteProduct(id: number): Promise<{ isDeleted: boolean; deletedProduct: Product }> {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException(
          `Product with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Failed to delete product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async searchProducts(query: string): Promise<{ products: Product[]; total: number; skip: number; limit: number }> {
    try {
      const response = await axios.get(`${this.baseUrl}/search?q=${query}`);
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to search products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}