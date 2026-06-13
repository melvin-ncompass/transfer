import { HttpStatus } from '@nestjs/common';
import { PaginationDto } from './dto/pagination.dto';
import { ApiResponseMessageEnum } from '../enum/enum';

export class PaginationResponse<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly lastPage: number;
  readonly message: string;
  readonly statusCode: HttpStatus;
  constructor(
    data: T[],
    total: number,
    query: PaginationDto,
    message: string = ApiResponseMessageEnum.SUCCESS,
    statusCode: HttpStatus = HttpStatus.OK,
    extra?: Record<string, any>,
  ) {
    const { page, limit } = query;
    const lastPage = Math.ceil(total / limit) || 1;

    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.lastPage = lastPage;
    this.message = message;
    this.statusCode = statusCode;
    if (extra) {
      Object.assign(this, extra);
    }
  }
}

export function pagination<T>(
  dataInput: T[],
  total: number,
  query: PaginationDto,
  message?: string,
  extra?: Record<string, any>,
): PaginationResponse<T> {
  const { page, limit } = query;
  const lastPage = Math.ceil(total / limit) || 1;
  return {
    data: dataInput,
    total: total,
    page: Number(page),
    limit: Number(limit),
    lastPage: lastPage,
    message: message,
    statusCode: HttpStatus.OK,
    ...extra,
  };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
