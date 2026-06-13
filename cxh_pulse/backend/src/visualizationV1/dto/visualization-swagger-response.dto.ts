import { PopulationWardChloropethDto } from './visualization.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString, IsArray } from 'class-validator';
export class MonthlyTemperatureResponseDto {
    @ApiProperty({
        type: Date,
        example: '2019-01-01T00:00:00.000Z',
    })
    @IsDateString()
    monthDate: Date

    @ApiProperty({
        type: Number,
        example: 29.99
    })
    @IsNumber()
    temperature: number
}

export class MonthlyRainfallResponseDto {
    @ApiProperty({
        type: Date,
        example: '2019-01-01T00:00:00.000Z',
    })
    @IsDateString()
    monthDate: Date

    @ApiProperty({
        type: Number,
        example: 12.9786354373209
    })
    @IsNumber()
    precipitation: number
}

export class PopulationWardChloropethResponseDto {
    @ApiProperty({
        type: String,
        example: 'aLP',
    })
    @IsString()
    wardId: string

    @ApiProperty({
        type: String,
        example: 'Kuku Ward',
    })
    @IsString()
    wardName: string

    @ApiProperty({
        type: Number,
        example: 6500
    })
    @IsNumber()
    latestPopulation: number
}

export class PopulationSubcountyChloropethResponseDto {
    @ApiProperty({
        type: String,
        example: 'Blz',
    })
    @IsString()
    subCountyId: string

    @ApiProperty({
        type: String,
        example: 'name',
    })
    @IsString()
    subCountyName: string

    @ApiProperty({
        type: Number,
        example: 6500
    })
    @IsNumber()
    latestPopulation: number
}

export class GeometryDto {
    @ApiProperty({
        type: String,
        example: 'Polygon'
    })
    type: string;

    @ApiProperty({
        type: Array,
        example: [
            [
                [
                    36.123456789,
                    -2.123456789
                ],
            ]
        ]
    })
    coordinates: number[][][]
}

export class SubCountyPropertiesDto {
    @ApiProperty({
        type: String,
        example: 'Apc',
    })
    @IsString()
    countyId: string

    @ApiProperty({
        type: String,
        example: 'Kajiado',
    })
    @IsString()
    countyName: string

    @ApiProperty({
        type: String,
        example: 'Blz',
    })
    @IsString()
    subCountyId: string

    @ApiProperty({
        type: String,
        example: 'name',
    })
    @IsString()
    subCountyName: string
}
export class SubcountyGeoJSONFeatureDto {
    @ApiProperty({
        type: Array,
        example: [
            10.1234567890123456,
            1.1234567890123456,
            11.1234567890123456,
            1.1234567890123456,
        ],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    bbox: number[];

    @ApiProperty({
        type: String,
        example: 'Feature'
    })
    type: string;

    @ApiProperty({
        type: [GeometryDto]
    })
    @IsArray()
    geometry: GeometryDto[];

    @ApiProperty({
        type: [SubCountyPropertiesDto]
    })
    @IsArray()
    properties: SubCountyPropertiesDto[];
}

export class SubcountyGeoJSONResponseDto {
    @ApiProperty({
        type: Array,
        example: [
            10.1234567890123456,
            1.1234567890123456,
            311.1234567890123456,
            1.1234567890123456,
        ],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    bbox: number[];

    @ApiProperty({
        type: String,
        example: 'FeatureCollection'
    })
    @IsString()
    type: string;

    @ApiProperty({
        type: [SubcountyGeoJSONFeatureDto]
    })
    @IsArray()
    features: SubcountyGeoJSONFeatureDto[];
}

export class WardDto {
    @ApiProperty({
        type: String,
        example: 'efg',
    })
    @IsString()
    wardId: string

    @ApiProperty({
        type: String,
        example: 'name',
    })
    @IsString()
    wardName: string
}
export class SubcountyDto {
    @ApiProperty({
        type: String,
        example: 'hgi',
    })
    @IsString()
    subcountyId: string

    @ApiProperty({
        type: String,
        example: 'name',
    })
    @IsString()
    subcountyName: string

    @ApiProperty({
        type: [WardDto]
    })
    @IsArray()
    wards: WardDto[];
}
export class KhisSubcountyResponseDto {
    @ApiProperty({
        type: String,
        example: 'Apc',
    })
    @IsString()
    countyId: string

    @ApiProperty({
        type: String,
        example: 'name',
    })
    @IsString()
    countyName: string

    @ApiProperty({
        type: [SubcountyDto]
    })
    @IsArray()
    subcounties: SubcountyDto[];
}

export class KhisIndicatorDateResponseDto {
    @ApiProperty({
        type: String,
        example: 'Apc',
    })
    @IsString()
    indicatorId: string

    @ApiProperty({
        type: String,
        example: 'name',
    })
    @IsString()
    indicatorName: string

    @ApiProperty({
        type: Number,
        example: 2019
    })
    @IsNumber()
    minYear: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    minMonth: number

    @ApiProperty({
        type: Number,
        example: 2020
    })
    @IsNumber()
    maxYear: number

    @ApiProperty({
        type: Number,
        example: 12
    })
    @IsNumber()
    maxMonth: number

    @ApiProperty({
        type: String,
        example: 'baby'
    })
    @IsString()
    category: string


}


export class KajiadoWardPropertiesDto {

    @ApiProperty({
        type: String,
        example: 'Efg',
    })
    @IsString()
    wardId: string

    @ApiProperty({
        type: String,
        example: 'Apc',
    })
    @IsString()
    countyId: string

    @ApiProperty({
        type: String,
        example: ' ward name',
    })
    @IsString()
    wardName: string

    @ApiProperty({
        type: String,
        example: 'county name',
    })
    @IsString()
    countyName: string

    @ApiProperty({
        type: String,
        example: 'Blz',
    })
    @IsString()
    subcountyId: string

    @ApiProperty({
        type: String,
        example: 'subcounty ',
    })
    @IsString()
    subcountyName: string
}

export class KhisKajiadoWardsFeatureDto {
    @ApiProperty({
        type: Array,
        example: [
            10.1234567890123456,
            1.1234567890123456,
            11.1234567890123456,
            1.1234567890123456,
        ],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    bbox: number[];

    @ApiProperty({
        type: String,
        example: 'Feature'
    })
    type: string;

    @ApiProperty({
        type: [GeometryDto]
    })
    @IsArray()
    geometry: GeometryDto[];

    @ApiProperty({
        type: [KajiadoWardPropertiesDto]
    })
    @IsArray()
    properties: KajiadoWardPropertiesDto[];
}

export class KhisKajiadoWardsResponseDto {
    @ApiProperty({
        type: Array,
        example: [
            10.1234567890123456,
            1.1234567890123456,
            311.1234567890123456,
            1.1234567890123456,
        ],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    bbox: number[];

    @ApiProperty({
        type: String,
        example: 'FeatureCollection'
    })
    @IsString()
    type: string;

    @ApiProperty({
        type: [KhisKajiadoWardsFeatureDto]
    })
    @IsArray()
    features: KhisKajiadoWardsFeatureDto[];
}

export class KajiadoFacilityPropertiesDto {
    @ApiProperty({
        type: Number,
        example: 10.1234567890123456,
    })
    @IsNumber()
    latitude: number

    @ApiProperty({
        type: Number,
        example: 10,
    })
    @IsNumber()
    noOfBeds: number

    @ApiProperty({
        type: Number,
        example: 10,
    })
    @IsNumber()
    noOfCots: number

    @ApiProperty({
        type: Number,
        example: -2.74492,
    })
    @IsNumber()
    longitude: number

    @ApiProperty({
        type: String,
        example: 'Dispensary',
    })
    @IsString()
    facilityType: string

    @ApiProperty({
        type: String,
        example: 'Abc Dispensary ',
    })
    @IsString()
    healthFacilityName: string
}


export class KajiadoFacilityFeatureDto {
    @ApiProperty({
        type: String,
        example: 'Feature'
    })
    type: string;

    @ApiProperty({
        type: [GeometryDto]
    })
    @IsArray()
    geometry: GeometryDto[];

    @ApiProperty({
        type: [KajiadoFacilityPropertiesDto]
    })
    @IsArray()
    properties: KajiadoFacilityPropertiesDto[];
}

export class KhisKajiadoFacilityResponseDto {
    @ApiProperty({
        type: String,
        example: 'FeatureCollection'
    })
    @IsString()
    type: string;

    @ApiProperty({
        type: [KajiadoFacilityFeatureDto]
    })
    @IsArray()
    features: KajiadoFacilityFeatureDto[];
}

export class KhisIndicatorCountResponseDto {

    @ApiProperty({
        type: Number,
        example: 2019
    })
    @IsNumber()
    comYear: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    comMonth: number

    @ApiProperty({
        type: String,
        example: 'Efg',
    })
    @IsString()
    wardId: string

    @ApiProperty({
        type: Number,
        example: 120
    })
    @IsNumber()
    totalValue: number

    @ApiProperty({
        type: String,
        example: 'name',
    })
    @IsString()
    wardName: string
}

export class IndicatorTrendDataDto {
    @ApiProperty({
        type: Number,
        example: 2019
    })
    @IsNumber()
    comYear: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    comMonth: number

    @ApiProperty({
        type: Number,
        example: 10
    })
    @IsNumber()
    totalValue: number
}

export class KhisIndicatorTrendResponseDto {
    @ApiProperty({
        type: String,
        example: 'abc'
    })
    @IsString()
    indicatorId: string

    @ApiProperty({
        type: String,
        example: 'name'
    })
    @IsString()
    indicatorName: string

    @ApiProperty({
        type: String,
        example: 'baby'
    })
    @IsString()
    category: string

    @ApiProperty({
        type: [IndicatorTrendDataDto]
    })
    @IsArray()
    trendData: IndicatorTrendDataDto[];

}

export class RiskTreeResponseDto {
    @ApiProperty({
        type: String,
        example: 'baby_risk'
    })
    @IsString()
    category: string

    @ApiProperty({
        type: String,
        example: 'urgent'
    })
    @IsString()
    priorityLevel: string

    @ApiProperty({
        type: String,
        example: 'difficulty breathing'
    })
    @IsString()
    intent: string

    @ApiProperty({
        type: Number,
        example: 100
    })
    @IsNumber()
    intentCount: number
}

export class IntentTrendDataDto {
    @ApiProperty({
        type: Number,
        example: 2019
    })
    @IsNumber()
    comYear: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    comMonth: number

    @ApiProperty({
        type: Number,
        example: 10
    })
    @IsNumber()
    totalValue: number
}

export class ChangeDataDto {
    @ApiProperty({
        type: Number,
        example: 0
    })
    @IsNumber()
    initialValue: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    finalValue: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    overallPercentChange: number
}
export class EachIntentTrendResponseDto {
    @ApiProperty({
        type: String,
        example: 'difficulty breathing'
    })
    @IsString()
    intent: string

    @ApiProperty({
        type: String,
        example: 'baby_risk'
    })
    @IsString()
    category: string

    @ApiProperty({
        type: String,
        example: 'urgent'
    })
    @IsString()
    priorityLevel: string

    @ApiProperty({
        type: [IntentTrendDataDto]
    })
    @IsArray()
    trendData: IntentTrendDataDto[];

    @ApiProperty({
        type: [ChangeDataDto]
    })
    @IsArray()
    changeData: ChangeDataDto[];

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    totalCount: number
}

export class IntentRelativeIntensityResponseDto {
    @ApiProperty({
        type: String,
        example: 'Abortion'
    })
    @IsString()
    rawIntent: string

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    tempBin: number

    @ApiProperty({
        type: Number,
        example: 20
    })
    @IsNumber()
    tempRangeStart: number

    @ApiProperty({
        type: Number,
        example: 25
    })
    @IsNumber()
    tempRangeEnd: number

    @ApiProperty({
        type: Number,
        example: 100
    })
    @IsNumber()
    intentCount: number

    @ApiProperty({
        type: Number,
        example: 0.1
    })
    @IsNumber()
    intensityPercent: number
}

export class IntentPriorityFrequencyResponseDto {

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    tempBin: number

    @ApiProperty({
        type: Number,
        example: 20
    })
    @IsNumber()
    tempRangeStart: number

    @ApiProperty({
        type: Number,
        example: 25
    })
    @IsNumber()
    tempRangeEnd: number

    @ApiProperty({
        type: String,
        example: '20-25'
    })
    @IsString()
    temperatureRange: string

    @ApiProperty({
        type: String,
        example: 'urgent'
    })
    @IsString()
    priorityLevel: string

    @ApiProperty({
        type: Number,
        example: 100
    })
    @IsNumber()
    priorityCount: number

    @ApiProperty({
        type: Number,
        example: 0.2
    })
    @IsNumber()
    frequencyRatio: number
}

export class KhisPredictionResponseDto {
    @ApiProperty({
        type: Date,
        example: '2019-01-01T00:00:00.000Z',
    })
    @IsDateString()
    monthDate: Date

    @ApiProperty({
        type: Number,
        example: 0.07
    })
    @IsNumber()
    rawValue: number

    @ApiProperty({
        type: Number,
        example: 0.05
    })
    @IsNumber()
    rawCiLow: number

    @ApiProperty({
        type: Number,
        example: 0.08
    })
    @IsNumber()
    rawCiHigh: number

    @ApiProperty({
        type: String,
        example: 'projected'
    })
    @IsString()
    rawType: string
}

export class CopernicusPredictionResponseDto{
     @ApiProperty({
        type: Number,
        example: 29.99
    })
    @IsNumber()
    temperature: number

     @ApiProperty({
        type: Number,
        example: 13.99
    })
    @IsNumber()
    precipitation: number

    @ApiProperty({
        type: Number,
        example: 2019
    })
    @IsNumber()
    comYear: number

    @ApiProperty({
        type: Number,
        example: 1
    })
    @IsNumber()
    comMonth: number

    @ApiProperty({
        type: String,
        example: 'historical'
    })
    @IsString()
    rawType: string
}

export class GetIndicatorsResponseDto{
    @ApiProperty({
        type: String,
        example: 'jsgfba'
    })
    @IsString()
    indicatorId: string

    @ApiProperty({
        type: String,
        example: 'Malaria case rate'
    })
    @IsString()
    indicatorName: string
}