import { IsString } from "class-validator";

export class ColumnConfigDto {
  @IsString()
  header: string; 

  @IsString()
  key: string; 
}