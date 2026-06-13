import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { ForecastSwagger } from './swagger/forecast.swagger';
import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ApiExtraModels } from '@nestjs/swagger';
import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { BlockAllGuard } from 'src/utils/block.guard';
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
import {
  CopernicusPredictionDto,
  KhisPredictionDto,
} from '../dto/visualization.dto';
import { ForecastService } from './forecast.service';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';
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
@Permissions(PermissionEnum.MANAGE_FORECAST)
@Controller('visualizationV1')
export class ForecastController {
  private readonly logger = new Logger(ForecastService.name);
  constructor(private readonly forecastService: ForecastService) {}

  @Get('/khis/prediction')
  @ApiExtraModels(KhisPredictionDto)
  @SwaggerEndpoint(ForecastSwagger, 'KHIS_PREDICTION')
  async getKhisPrediction(@Query() filters: KhisPredictionDto) {
    try {
      const result = await this.forecastService.getKhisPrediction(filters);
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

  @Get('/copernicus/prediction')
  @ApiExtraModels(CopernicusPredictionDto)
  @SwaggerEndpoint(ForecastSwagger, 'COPERNICUS_PREDICTION')
  async getCopernicusPrediction(@Query() filters: CopernicusPredictionDto) {
    try {
      const result =
        await this.forecastService.getCopernicusPrediction(filters);
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

  @Get('/prediction/indicators')
  @SwaggerEndpoint(ForecastSwagger,'GET_INDICATORS')
  async getPredictionIndicators() {
    try {
      const result =
        await this.forecastService.getPredictionIndicators();
      return new ApiResponse(
        result,
        'Prediction indicators list fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getPredictionIndicators',
      );
    }
  }
}
