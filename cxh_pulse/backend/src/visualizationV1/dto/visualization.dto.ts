import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  IsIn,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class ClimateFilterDto {
  //   @IsOptional()
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  //   @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  //   @IsOptional()
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  //   @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
    default: 'Hsk1YV8kHkT',
  })
  @IsOptional()
  @IsString()
  county?: string = 'Hsk1YV8kHkT';

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcounty?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  ward?: string;
}

export class KajiadoWardsFilterDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  countyId: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;
}

export class KajiadoFacilitiesFilterDto {
  @ApiPropertyOptional({
    type: String,
    required: true,
  })
  @IsOptional()
  @IsString()
  countyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subCountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;
}


export class TemperatureFilterDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
    default: 'Kajiado',
  })
  @IsOptional()
  @IsString()
  county?: string = 'Hsk1YV8kHkT';

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcounty?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  ward?: string;
}

export class PrecipitationFilterDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
    default: 'Kajiado',
  })
  @IsOptional()
  @IsString()
  county?: string = 'Hsk1YV8kHkT';

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcounty?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  ward?: string;
}

export class KhisIndicatorCountFilterDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsString()
  indicators?: string;

  @ApiPropertyOptional({
    type: String,
    default: 'Kajiado',
  })
  @IsOptional()
  @IsString()
  county?: string = 'Hsk1YV8kHkT';

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcounty?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  ward?: string;
}

export enum BroaderCategory {
  MATERNAL_RISK = 'maternal_risk',
  BABY_RISK = 'baby_risk',
  OTHER = 'other',
}
export class PromptsIntentsFilterDto {
  @ApiPropertyOptional({
    type: String,
    enum: BroaderCategory,
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(BroaderCategory))
  broaderCategory?: string;
}

export const COUNTY_MAP: Record<string, string> = {
  KAJIADO: 'Kajiado County',
};

export class PromptsFilterDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiProperty({
    type: String,
    required: true,
  })
  @IsString()
  countyId: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;
}

export class PromptsRiskDto {
  @ApiProperty({
    type: String,
    enum: ['maternal_risk', 'baby_risk'],
  })
  @IsString()
  @IsIn(['maternal_risk', 'baby_risk'])
  category: string;
}

export enum PriorityLevel {
  HIGH = 'high',
  LOW = 'low',
  DANGER_SIGN_URGENT = 'danger sign/urgent',
}

export class PromptsPriorityLevelDto {
  @ApiPropertyOptional({
    type: String,
    enum: PriorityLevel,
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(PriorityLevel))
  priorityLevel: string;
}

// export class IndicatorCountByTemperatureFilterDto {
//   @IsNumber()
//   startYear?: number;

//   @IsNumber()
//   @Min(1)
//   @Max(12)
//   startMonth?: number;

//   @IsNumber()
//   endYear?: number;

//   @IsNumber()
//   @Min(1)
//   @Max(12)
//   endMonth?: number;

//   @IsString()
//   indicator?: string;

//   @IsOptional()
//   @IsString()
//   county?: string = 'Kajiado';

//   @IsOptional()
//   @IsString()
//   subcounty?: string;

//   @IsOptional()
//   @IsString()
//   ward?: string;
// }

export class IndicatorCountByPrecipitationFilterDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsString()
  indicator?: string;

  @ApiPropertyOptional({
    type: String,
    default: 'Kajiado',
  })
  @IsOptional()
  @IsString()
  county?: string = 'Hsk1YV8kHkT';

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcounty?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  ward?: string;
}

export class IndicatorCountByClimateFilterDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsString()
  indicator?: string;

  @ApiPropertyOptional({
    type: String,
    default: 'Kajiado',
  })
  @IsOptional()
  @IsString()
  county?: string = 'Hsk1YV8kHkT';

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcounty?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  ward?: string;
}

export class IndicatorCountTrendDto {
  @ApiPropertyOptional({
    type: String,
  })
  @IsString()
  indicator?: string;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  // @IsOptional()
  // @IsString()
  // county?: string = 'Kajiado';

  // @IsOptional()
  // @IsString()
  // subcounty?: string;

  // @IsOptional()
  // @IsString()
  // ward?: string;
}

export class IndicatorCountByDateRangeDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  // @IsOptional()
  @ApiPropertyOptional({
    type: String,
  })
  @IsString()
  indicatorId?: string;
}

export class EachIndicatorTrendFilterDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  indicator?: string;

  // @IsOptional()
  // @IsString()
  // county?: string = 'Kajiado';
}

export class PopulationWardChloropethDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;
}

export class PopulationSubCountyChloropethDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcountyId?: string;
}

export class getPopulationChloropethSubCountyGeoJSONDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  countyId?: string;
}

export class EachIntentTrendFilterDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  // @IsOptional()
  // @IsString()
  // county?: string = 'Kajiado';
}

export class PromptsIntentRelativeIntensityDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;
}

export class PromptsIntentPriorityFrequencyDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  endYear?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subcountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;

  @ApiPropertyOptional({
    type: String,
    enum: BroaderCategory,
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(BroaderCategory))
  category?: string;
}

export enum IndicatorName {
  SEVERE_MUAC_PERCENTAGE = 'severe_MUAC_percentage',
  STILLBIRTH_RATE = 'stillbirth_rate',
  LOW_BIRTH_WEIGHT_PCT = 'low_birth_weight_pct',
  NEONATAL_MORTALITY_RATE = 'neonatal_mortality_rate',
  MALARIA_CASE_RATE = 'malaria_case_rate',
}

export class KhisPredictionDto {

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  indicatorId: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  countyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subCountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CopernicusPredictionDto {
  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  countyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  subCountyId?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  wardId?: string;
}

export class EachIndicatorTrendFilterDtoV1 {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  startYear: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth: number;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  endYear: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth: number;

  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsString()
  subcountyId?: string;

  @IsOptional()
  @IsString()
  indicatorId?: string; // raw_dataelement
}

export const WARD_MAP: Record<string, string> = {
  // Kajiado North
  'Olkeri Ward': 'Olkeri Ward',
  'Ongata rongai Ward': 'Ongata Rongai Ward',
  'Nkaimurunya Ward': 'Nkaimurunya Ward',
  'Oloolua Ward': 'Oloolua Ward',
  'Ngong Ward': 'Ngong Ward',

  // Kajiado Central
  'Purko Ward': 'Purko Ward',
  'Ildamat Ward': 'Ildamat Ward',
  'Dalalekutuk Ward': 'Dalalekutuk Ward',
  'Matapato north Ward': 'Matapato North Ward',
  'Matapato south Ward': 'Matapato South Ward',

  // Kajiado East
  'Kaputiei north Ward': 'Kaputiei North Ward',
  'Kitengela Ward': 'Kitengela Ward',
  'Oloosirkon/sholinke Ward': 'Oloosirkon/Sholinke Ward',
  'Kenyawa-poka Ward': 'Kenyawa-poka Ward',
  'Imaroro Ward': 'Imaroro Ward',

  // Kajiado West
  'Keekonyokie Ward': 'Keekonyokie Ward',
  'Iloodokilani Ward': 'Iloodokilani Ward',
  'Magadi Ward': 'Magadi Ward',
  "Ewuaso oonkidong'i Ward": "Ewuaso Oo Nkidong'i Ward",
  'Mosiro Ward': 'Mosiro Ward',

  // Loitokitok
  'Kimana Ward': 'Kimana Ward',
  'Entonet/lenkism Ward': 'Entonet/Lenkism Ward',
  'Imbrikani/eselelnkei Ward': 'Imbrikani/Eselelnkei Ward',
  'Kuku Ward': 'Kuku Ward',
  'Rombo Ward': 'Rombo Ward',
};
