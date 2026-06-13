import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsResponseDto {
  @ApiProperty({ description: 'Query result data' })
  data: any[];

  @ApiProperty({ description: 'Query execution time in milliseconds' })
  executionTimeMs: number;

  @ApiProperty({ description: 'Number of rows returned' })
  rowCount: number;

  @ApiProperty({ description: 'Engine used for the query', enum: ['postgresql', 'clickhouse', 'duckdb'] })
  engine: string;

  @ApiPropertyOptional({ description: 'The SQL query executed' })
  query?: string;
}

export class BenchmarkResultDto {
  @ApiProperty({ description: 'Engine name' })
  engine: string;

  @ApiPropertyOptional({ description: 'Execution time in milliseconds' })
  executionTimeMs: number | null;

  @ApiPropertyOptional({ description: 'Number of rows returned' })
  rowCount: number | null;

  @ApiProperty({ description: 'Whether the query was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error: string | null;
}

export class BenchmarkResponseDto {
  @ApiProperty({ description: 'Type of query benchmarked' })
  queryType: string;

  @ApiProperty({ description: 'Timestamp of the benchmark' })
  timestamp: string;

  @ApiProperty({ type: [BenchmarkResultDto], description: 'Results from each engine' })
  results: BenchmarkResultDto[];

  @ApiPropertyOptional({ description: 'The fastest engine' })
  fastest: string | null;

  @ApiProperty({ description: 'Human-readable comparison' })
  comparison: string;
}
