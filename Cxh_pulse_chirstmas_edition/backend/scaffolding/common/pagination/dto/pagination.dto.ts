import { IsInt, IsOptional, Min } from "class-validator";
import { ArchiveStatus } from "scaffolding/common/enum/enum";

export class PaginationDto{ 
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly page?: number;
  
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly limit?: number;
}


