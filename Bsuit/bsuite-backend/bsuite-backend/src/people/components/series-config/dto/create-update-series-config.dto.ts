import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { SeriesName } from "../entities/tenant.series-config.entity";

export class CreateOrUpdateSeriesConfigDto{
  
  @IsString()
  @IsNotEmpty()
  seriesPrefixPermanent: string;

  @IsString()
  @IsNotEmpty()
  seriesPrefixIntern: string;

}