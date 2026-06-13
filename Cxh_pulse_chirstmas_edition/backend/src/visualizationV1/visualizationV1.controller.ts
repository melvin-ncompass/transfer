import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { VisualizationV1Service } from './visualizationV1.service';
import {
  ClimateFilterDto,
  CopernicusPredictionDto,
  EachIndicatorTrendFilterDto,
  EachIntentTrendFilterDto,
  getPopulationChloropethSubCountyGeoJSONDto,
  IndicatorCountByClimateFilterDto,
  IndicatorCountByDateRangeDto,
  IndicatorCountByPrecipitationFilterDto,
  IndicatorCountTrendDto,
  KajiadoWardsFilterDto,
  KhisIndicatorCountFilterDto,
  KhisPredictionDto,
  PopulationSubCountyChloropethDto,
  PopulationWardChloropethDto,
  PrecipitationFilterDto,
  PromptsFilterDto,
  PromptsIntentPriorityFrequencyDto,
  PromptsIntentRelativeIntensityDto,
  PromptsIntentsFilterDto,
  PromptsPriorityLevelDto,
  PromptsRiskDto,
  TemperatureFilterDto,
} from './dto/visualization.dto';
import { safeImportModule } from 'src/utils/module-loader';
import { BlockAllGuard } from 'src/utils/block.guard';
import { ApiResponse } from 'src/utils/api-response/api-response.utils';
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';

let ActiveAuthGuard: any;

// const scaffoldModule = safeImportModule('scaffolding/scaffold.module');

//if (scaffoldModule) {
try {
  const {
    JwtAuthGuard,
  } = require('../../scaffolding/user/auth/jwt-auth.guard');
  ActiveAuthGuard = JwtAuthGuard;
} catch (err) {
  console.warn('Failed to load JwtAuthGuard, using fallback:', err.message);
  ActiveAuthGuard = BlockAllGuard;
}
// } else {
//   ActiveAuthGuard = BlockAllGuard;
// }

@UseGuards(ActiveAuthGuard)
@Controller('visualizationV1')
export class VisualizationV1Controller {
  private readonly logger = new Logger(VisualizationV1Controller.name);

  constructor(
    private readonly visualizationV1Service: VisualizationV1Service,
  ) {}

  @Get('khis/wardSubCounty')
  async getKajiadoSubcountyWardList() {
    try {
      const result =
        await this.visualizationV1Service.getKajiadoSubcountyWardList();
      return new ApiResponse(
        result,
        'Kajiado subcounty and ward list fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKajiadoSubcountyWardList',
      );
    }
  }

  @Get('khis/indicatorDateFilter')
  async getKhisIndicatorsWithinGlobalDateRange(
    @Query('indicator') indicator?: string,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getIndicatorDateRange(indicator);
      return new ApiResponse(
        result,
        'KHIS indicators within global date range fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKhisIndicatorsWithinGlobalDateRange',
      );
    }
  }
  @Get('copernicus/climate')
  async getCopernicusClimateData(@Query() filters: ClimateFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getCopernicusClimateDataV2(filters);
      return new ApiResponse(
        result,
        'Copernicus climate data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getCopernicusClimateData',
      );
    }
  }

  @Get('khis/kajiadoWards')
  async getKajiadoWardList(@Query() filters: KajiadoWardsFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getKajiadoWardList(filters);
      return new ApiResponse(
        result,
        'Fetched list of Kajiado Wards successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKajiadoWardList',
      );
    }
  }

  @Get('copernicus/temperature')
  async getCopernicusTemperature(@Query() filters: TemperatureFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getCopernicusTemperatureData(filters);
      return new ApiResponse(
        result,
        'Fetched temperature data for the give date range',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getCopernicusTemperature',
      );
    }
  }

  @Get('copernicus/precipitation')
  async getCopernicusPrecipitation(@Query() filters: PrecipitationFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getCopernicusPrecipitationData(
          filters,
        );
      return new ApiResponse(
        result,
        'Fetched precipitation data for the given date range',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getCopernicusPrecipitation',
      );
    }
  }

  @Get('khis/indicatorCount')
  async getKhisIndicatorCount(@Query() filters: KhisIndicatorCountFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getKhisIndicatorCount(filters);
      return new ApiResponse(
        result,
        'Fetched KHIS indicator count successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKhisIndicatorCount',
      );
    }
  }

  @Get('kajiado/facility')
  async getFacilities() {
    try {
      const result = await this.visualizationV1Service.getKajiadoFacilities();
      return new ApiResponse(
        result,
        'Fetched Kajiado facilities successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKajiadoFacilities',
      );
    }
  }

  @Get('prompts/intents')
  async getPromptsIntents(@Query() filters: PromptsIntentsFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getPromptsIntents(filters);
      return new ApiResponse(
        result,
        'Fetched prompts intents successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPromptsIntents',
      );
    }
  }

  @Get('prompts/monthlyTemperature')
  async getMonthlyTemprature(@Query() filters: PromptsFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getMonthlyTemperature(filters);
      return new ApiResponse(
        result,
        'Fetched monthly temperature successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> monthlyTemperature',
      );
    }
  }

  @Get('prompts/monthlyRainfall')
  async getMonthlyRainfall(@Query() filters: PromptsFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getMonthlyRainfall(filters);
      return new ApiResponse(
        result,
        'Fetched monthly rainfall successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> monthlyRainfall',
      );
    }
  }

  @Get('prompts/monthlyTemperaturePrecipitation')
  async getMonthlyTemperaturePrecipitation(@Query() filters: PromptsFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getMonthlyTemperaturePrecipitation();
      return new ApiResponse(
        result,
        'Fetched monthly temperature and precipitation successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> monthlyTemperaturePrecipitation',
      );
    }
  }

  @Get('prompts/riskTreeMap')
  async getRiskTreeMap(@Query() filters: PromptsRiskDto) {
    try {
      const result = await this.visualizationV1Service.getRiskTreeMap(filters);
      return new ApiResponse(result, 'Fetched risk tree map successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getRiskTreeMap',
      );
    }
  }

  @Get('prompts/categoryByPriorityLevel')
  async getCategoryByPriorityLevel(@Query() filters: PromptsPriorityLevelDto) {
    try {
      const result =
        await this.visualizationV1Service.getCategoryByPriorityLevel(filters);
      return new ApiResponse(result, 'Fetched risk tree map successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getRiskTreeMap',
      );
    }
  }

  @Get('prompts/categoryByPriorityLevelBar')
  async getCategoryByPriorityLevelBar() {
    try {
      const result =
        await this.visualizationV1Service.getCategoryByPriorityLevelBar();
      return new ApiResponse(result, 'Fetched risk tree map successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getRiskTreeMap',
      );
    }
  }

  @Get('prompts/categoryByPriorityLevelHeatmap')
  async getCategoryByPriorityLevelHeatmap() {
    try {
      const result =
        await this.visualizationV1Service.getCategoryByPriorityLevelHeatmap();
      return new ApiResponse(result, 'Fetched risk tree map successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getRiskTreeMap',
      );
    }
  }

  // @Get('prompts/monthlyPriorityTrend')
  // async getMonthlyPriorityTrend() {
  //   try {
  //     const result =
  //       await this.visualizationV1Service.getMonthlyPriorityTrend();
  //     return new ApiResponse(
  //       result,
  //       'Fetched monthly priority trend successfully',
  //       200,
  //     );
  //   } catch (error) {
  //     return throwServiceError(
  //       error,
  //       this.logger,
  //       'Visualization -> monthlyPriorityTrend',
  //     );
  //   }
  // }

  @Get('prompts/monthlyPriorityTrend')
  async getMonthlyPriorityTrend(
    @Query('category') category?: string,
    @Query('priorityLevel') priorityLevel?: string,
  ) {
    try {
      const result = await this.visualizationV1Service.getMonthlyPriorityTrend({
        category,
        priorityLevel,
      });
      return new ApiResponse(
        result,
        'Fetched monthly priority trend successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> monthlyPriorityTrend',
      );
    }
  }

  @Get('prompts/monthlyRisks')
  async getMonthlyRisks(@Query() filters: PromptsRiskDto) {
    try {
      const result = await this.visualizationV1Service.getMonthlyRisks(filters);
      return new ApiResponse(result, 'Fetched monthly risks successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> monthlyRisks',
      );
    }
  }

  @Get('khis/indicatorCountByClimate/:climateType')
  async getIndicatorCountByClimate(
    @Query() filters: IndicatorCountByClimateFilterDto,
    @Param('climateType') climateType: 'precipitation' | 'temperature',
  ) {
    try {
      const result =
        await this.visualizationV1Service.getIndicatorCountByClimate(
          filters,
          climateType,
        );
      return new ApiResponse(
        result,
        'Fetched KHIS indicator count by climate successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getIndicatorCountByClimate',
      );
    }
  }

  @Get('khis/indicatorCountTrend')
  async getIndicatorCountTrend(@Query() filters: IndicatorCountTrendDto) {
    try {
      const result =
        await this.visualizationV1Service.getIndicatorCountTrend(filters);
      return new ApiResponse(
        result,
        'Fetched KHIS indicator count trend successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getIndicatorCountTrend',
      );
    }
  }

  @Get('khis/indicatorCount/date-range')
  async getKhisIndicatorCountByDateRange(
    @Query() filters: IndicatorCountByDateRangeDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getKhisIndicatorCountByDateRange(
          filters,
        );

      return new ApiResponse(
        result,
        'KHIS indicator count by date range fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKhisIndicatorCountByDateRange',
      );
    }
  }

  @Get('khis/eachIndicatorTrend')
  async getKhisEachIndicatorTrend(
    @Query() filters: EachIndicatorTrendFilterDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getKhisEachIndicatorTrend(filters);

      return new ApiResponse(
        result,
        'KHIS each indicator trend data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKhisEachIndicatorTrend',
      );
    }
  }

  @Get('population/ward/chloropeth')
  async getPopulationWardChloropeth(
    @Query() filters: PopulationWardChloropethDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getPopulationWardChloropeth(filters);

      return new ApiResponse(
        result,
        'Population ward chloropeth data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPopulationWardChloropeth',
      );
    }
  }

  @Get('population/subcounty/chloropeth')
  async getPopulationSubCountyChloropeth(
    @Query() filters: PopulationSubCountyChloropethDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getPopulationSubCountyChloropeth(
          filters,
        );

      return new ApiResponse(
        result,
        'Population subcounty chloropeth data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPopulationSubCountyChloropeth',
      );
    }
  }

  @Get('population/chloropeth/subcounty-geojson')
  async getPopulationChloropethSubCountyGeoJSON(
    @Query() filters: getPopulationChloropethSubCountyGeoJSONDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getPopulationChloropethSubCountyGeoJSON(
          filters,
        );

      return new ApiResponse(
        result,
        'Population chloropeth subcounty geoJSON data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPopulationChloropethSubCountyGeoJSON',
      );
    }
  }

  @Get('prompts/eachIntentTrend')
  async getPromptsEachIntentTrend(@Query() filters: EachIntentTrendFilterDto) {
    try {
      const result =
        await this.visualizationV1Service.getPromptsEachIntentTrend(filters);

      return new ApiResponse(
        result,
        'Prompts each intent trend data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPromptsEachIntentTrend',
      );
    }
  }

  @Get('prompts/intentRelativeIntensity')
  async getPromptsIntentRelativeIntensity(
    @Query() filters: PromptsIntentRelativeIntensityDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getPromptsIntentRelativeIntensity(
          filters,
        );

      return new ApiResponse(
        result,
        'Prompts intent relative intensity data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPromptsIntentRelativeIntensity',
      );
    }
  }

  @Get('prompts/intentPriorityFrequency')
  async getPromptsIntentPriorityFrequency(
    @Query() filters: PromptsIntentPriorityFrequencyDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getPromptsIntentPriorityFrequency(
          filters,
        );
      return new ApiResponse(
        result,
        'Prompts intent priority frequency data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPromptsIntentPriorityFrequency',
      );
    }
  }

  @Get('khis/prediction')
  async getKhisPrediction(
    @Query() filters: KhisPredictionDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getKhisPrediction(
          filters,
        );
      return new ApiResponse(
        result,
        'Khis prediction data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKhisPrediction',
      );
    }
  }

  @Get('copernicus/prediction')
  async getCopernicusPrediction(
    @Query() filters: CopernicusPredictionDto,
  ) {
    try {
      const result =
        await this.visualizationV1Service.getCopernicusPrediction(
          filters,
        );
      return new ApiResponse(
        result,
        'Copernicus prediction data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getCopernicusPrediction',
      );
    }
  }
}
