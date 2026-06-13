import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  IsIn,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
export class ClimateFilterDto {
  //   @IsOptional()
  @IsNumber()
  startYear?: number;

  //   @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  //   @IsOptional()
  @IsNumber()
  endYear?: number;

  //   @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  county?: string = 'Kajiado';

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class KajiadoWardsFilterDto {
  @IsOptional()
  @IsString()
  county?: string = 'Kajiado';

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class TemperatureFilterDto {
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  county?: string = 'Kajiado';

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class PrecipitationFilterDto {
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  county?: string = 'Kajiado';

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class KhisIndicatorCountFilterDto {
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsString()
  indicators?: string;

  @IsOptional()
  @IsString()
  county?: string = 'Kajiado';

  @IsOptional()
  @IsString()
  subcounty?: string;

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
  @IsOptional()
  @IsString()
  @IsIn(Object.values(BroaderCategory))
  broaderCategory?: string;
}

export const COUNTY_MAP: Record<string, string> = {
  KAJIADO: 'Kajiado County',
};

export class PromptsFilterDto {
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  // @IsOptional()
  // @IsString()
  // county?: string = 'Kajiado';

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class PromptsRiskDto {
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
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsString()
  indicator?: string;

  @IsOptional()
  @IsString()
  county?: string = 'Kajiado';

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class IndicatorCountByClimateFilterDto {
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsString()
  indicator?: string;

  @IsOptional()
  @IsString()
  county?: string = 'Kajiado';

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class IndicatorCountTrendDto {
  @IsString()
  indicator?: string;

  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;

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
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  // @IsOptional()
  @IsString()
  indicator?: string;
}

export class EachIndicatorTrendFilterDto {
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  indicator?: string;

  // @IsOptional()
  // @IsString()
  // county?: string = 'Kajiado';
}

export class PopulationWardChloropethDto {
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class PopulationSubCountyChloropethDto {
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  subcounty?: string;
}

export class getPopulationChloropethSubCountyGeoJSONDto {
  @IsNumber()
  startYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsNumber()
  endYear?: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  subcounty?: string;
}

export class EachIntentTrendFilterDto {
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  category?: string;

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
  @IsString()
  search?: string;

  // @IsOptional()
  // @IsString()
  // county?: string = 'Kajiado';
}

export class PromptsIntentRelativeIntensityDto {
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;
}

export class PromptsIntentPriorityFrequencyDto {
  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsString()
  subcounty?: string;

  @IsOptional()
  @IsString()
  ward?: string;

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
  @IsString()
  @IsIn(Object.values(IndicatorName))
  indicatorName?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CopernicusPredictionDto {

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
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
