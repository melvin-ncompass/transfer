import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ApiExtraModels } from '@nestjs/swagger';
import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { BlockAllGuard } from "src/utils/block.guard";
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';
import { PromptsFilterDto } from '../dto/visualization.dto';
import { ClimateService } from './climate.service';
import { ClimateSwagger } from './swagger/climate.swagger';
import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
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
@Permissions(PermissionEnum.MANAGE_CLIMATE,PermissionEnum.MANAGE_OVERVIEW)
@Controller('visualizationV1/climate')
export class ClimateController {
  private readonly logger = new Logger(ClimateService.name);
  constructor(private readonly climateService: ClimateService) { }

  @Get('monthlyTemperature')
  @ApiExtraModels(PromptsFilterDto)
  @SwaggerEndpoint(ClimateSwagger, 'MONTHLY_TEMPERATURE')
  async getMonthlyTemprature(@Query() filters: PromptsFilterDto) {
    try {
      const result =
        await this.climateService.getMonthlyTemperature(filters);
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

  @Get('monthlyRainfall')
  @ApiExtraModels(PromptsFilterDto)
  @SwaggerEndpoint(ClimateSwagger, 'MONTHLY_RAINFALL')
  async getMonthlyRainfall(@Query() filters: PromptsFilterDto) {
    try {
      const result =
        await this.climateService.getMonthlyRainfall(filters);
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
}