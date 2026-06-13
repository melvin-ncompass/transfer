import {
  IsOptional,
  IsArray,
  IsString,
  IsISO8601,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ActivityFilterDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsISO8601({}, { message: 'Start time must be a valid ISO date string' })
  startTime?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'End time must be a valid ISO date string' })
  endTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value
  )
  users?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value
  )
  modules?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value
  )
  features?: string[];
}
