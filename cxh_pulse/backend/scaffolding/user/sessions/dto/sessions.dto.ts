import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'scaffolding/common/pagination/dto/pagination.dto';

export class PaginatedSessionFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  userFilter?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value.toString().includes('Invalid')) { 
      throw new BadRequestException(`Invalid date provided: ${value}`);
    }
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  })
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (value.toString().includes('Invalid')) {
      throw new BadRequestException(`Invalid date provided: ${value}`);
    }
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  })
  endDate?: Date;
}