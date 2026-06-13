import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  isDetailed?: boolean;
}
