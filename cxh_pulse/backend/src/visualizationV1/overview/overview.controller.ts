import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { OverviewSwagger } from './swagger/overview.swagger';
import { Controller, Get, Logger, Query, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiExtraModels } from '@nestjs/swagger';
import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { BlockAllGuard } from "src/utils/block.guard";
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
import { EachIndicatorTrendFilterDto, EachIndicatorTrendFilterDtoV1, EachIntentTrendFilterDto, IndicatorCountByDateRangeDto, KajiadoFacilitiesFilterDto, KajiadoWardsFilterDto, PopulationSubCountyChloropethDto, PopulationWardChloropethDto, getPopulationChloropethSubCountyGeoJSONDto } from '../dto/visualization.dto';
import { OverviewService } from './overview.service';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';
import { PromptsSwagger } from '../prompts/swagger/prompts.swagger';
import type { Response } from 'express';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';

let ActiveAuthGuard: any;
try {
  const {
    JwtAuthGuard,
  } = require('../../../scaffolding/user/auth/jwt-auth.guard');
  ActiveAuthGuard = JwtAuthGuard;
} catch (err) {
  console.warn('Failed to load JwtAuthGuard, using fallback:', err.message);
  ActiveAuthGuard = BlockAllGuard;
}

@UseGuards(ActiveAuthGuard, PermissionsGuard)
@Controller('visualizationV1')
export class OverviewController {
  private readonly logger = new Logger(OverviewService.name);
  constructor(private readonly overviewService: OverviewService) { }

  @Permissions(PermissionEnum.MANAGE_OVERVIEW)
  @Get('population/ward/chloropeth')
  @ApiExtraModels(PopulationWardChloropethDto)
  @SwaggerEndpoint(OverviewSwagger, 'POPULATION_WARD_CHLOROPETH')
  async getPopulationWardChloropeth(
    @Query() filters: PopulationWardChloropethDto,
  ) {
    try {
      const result =
        await this.overviewService.getPopulationWardChloropeth(filters);

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

  @Permissions(PermissionEnum.MANAGE_OVERVIEW)
  @Get('population/subcounty/chloropeth')
  @ApiExtraModels(PopulationSubCountyChloropethDto)
  @SwaggerEndpoint(OverviewSwagger, 'POPULATION_SUBCOUNTY_CHLOROPETH')
  async getPopulationSubCountyChloropeth(
    @Query() filters: PopulationSubCountyChloropethDto,
  ) {
    try {
      const result =
        await this.overviewService.getPopulationSubCountyChloropeth(
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

  @Permissions(PermissionEnum.MANAGE_OVERVIEW)
  @Get('population/chloropeth/subcounty-geojson')
  @ApiExtraModels(getPopulationChloropethSubCountyGeoJSONDto)
  @SwaggerEndpoint(OverviewSwagger, 'POPULATION_CHLOROPETH_SUBCOUNTY_GEOJSON')
  async getPopulationChloropethSubCountyGeoJSON(
    @Query() filters: getPopulationChloropethSubCountyGeoJSONDto,
  ) {
    try {
      const result =
        await this.overviewService.getPopulationChloropethSubCountyGeoJSON(
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

  @Permissions(PermissionEnum.MANAGE_DASHBOARD)
  @Get('wardSubCounty')
  @SwaggerEndpoint(OverviewSwagger, 'WARD_SUBCOUNTY')
  async getKajiadoSubcountyWardList() {
    try {
      const result =
        await this.overviewService.getKajiadoSubcountyWardList();
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

  @Permissions(PermissionEnum.MANAGE_DASHBOARD)
  @Get('khis/indicatorDateFilter')
  @SwaggerEndpoint(OverviewSwagger, 'KHIS_INDICATOR_DATE_FILTER')
  async getKhisIndicatorsWithinGlobalDateRange(
    @Query('indicator') indicator?: string,
  ) {
    try {
      const result =
        await this.overviewService.getIndicatorDateRange(indicator);
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

  @Permissions(PermissionEnum.MANAGE_DASHBOARD)
  @Get('kajiadoWards')
  @ApiExtraModels(KajiadoWardsFilterDto)
  @SwaggerEndpoint(OverviewSwagger, 'KAJIADO_WARDS')
  async getKajiadoWardList(@Query() filters: KajiadoWardsFilterDto) {
    try {
      const result =
        await this.overviewService.getKajiadoWardList(filters);
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

  @Permissions(PermissionEnum.MANAGE_OVERVIEW)
  @Get('kajiado/facility')
  @ApiExtraModels(KajiadoFacilitiesFilterDto)
  @SwaggerEndpoint(OverviewSwagger, 'KHIS_KAJIADO_FACILITY')
  async getFacilities(@Query() filters: KajiadoFacilitiesFilterDto) {
    try {
      const result = await this.overviewService.getKajiadoFacilities(filters);
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

  @Permissions(PermissionEnum.MANAGE_OVERVIEW)
  @Get('khis/indicatorCount/date-range')
  @ApiExtraModels(IndicatorCountByDateRangeDto)
  @SwaggerEndpoint(OverviewSwagger, 'KHIS_INDICATOR_COUNT_DATE_RANGE')
  async getKhisIndicatorCountByDateRange(
    @Query() filters: IndicatorCountByDateRangeDto,
  ) {
    try {
      const result =
        await this.overviewService.getKhisIndicatorCountByDateRange(
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

  @Permissions(PermissionEnum.MANAGE_OVERVIEW)
  @Get('khis/eachIndicatorTrend')
  @ApiExtraModels(EachIndicatorTrendFilterDto)
  @SwaggerEndpoint(OverviewSwagger, 'KHIS_EACH_INDICATOR_TREND')
  async getKhisEachIndicatorTrend(
    @Query() filters: EachIndicatorTrendFilterDtoV1,
  ) {
    try {
      const result =
        await this.overviewService.getKhisEachIndicatorTrend(filters);

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

  @Permissions(PermissionEnum.MANAGE_PROMPTS,PermissionEnum.MANAGE_OVERVIEW)
  @Get('prompts/eachIntentTrend')
  @ApiExtraModels(EachIntentTrendFilterDto)
  @SwaggerEndpoint(PromptsSwagger, 'EACH_INTENT_TREND')
  async getPromptsEachIntentTrend(@Query() filters: EachIntentTrendFilterDto) {
    try {
      const result =
        await this.overviewService.getPromptsEachIntentTrend(filters);

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

  @Permissions(PermissionEnum.MANAGE_REPORTS)
  @Get('prompts/eachIntentTrend/csv')
  @ApiExtraModels(EachIntentTrendFilterDto)
  @SwaggerEndpoint(OverviewSwagger, 'EACH_INTENT_CSV')
  async getPromptsEachIntentTrendCsv(@Res({ passthrough: true }) res: Response, @Query() filters: EachIntentTrendFilterDto) {
    try {
      res.set({
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': 'attachment; filename="eachIntentTrend.csv"',
      });

      const csvStream = await this.overviewService.getPromptsEachIntentTrendCsv(filters);
      return new StreamableFile(csvStream);

    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPromptsEachIntentTrendCsv',
      );
    }
  }

  

  @Permissions( PermissionEnum.MANAGE_REPORTS)
  @Get('khis/eachIndicatorTrend/csv')
  @ApiExtraModels(EachIndicatorTrendFilterDtoV1)
  @SwaggerEndpoint(OverviewSwagger, 'EACH_INDICATOR_CSV')
  async getKhisEachIndicatorTrendCsv(@Res({ passthrough: true }) res: Response, @Query() filters: EachIndicatorTrendFilterDtoV1) {
    try {
      res.set({
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': 'attachment; filename="eachIndicatorTrend.csv"',
      });

      const csvStream = await this.overviewService.getKhisEachIndicatorTrendCsv(filters);
      return new StreamableFile(csvStream);

    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getKhisEachIndicatorTrendCsv',
      );
    }
  }

}
