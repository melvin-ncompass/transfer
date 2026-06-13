import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { VisualizationService } from './visualization.service';
import { ApiResponse } from 'src/utils/api-response/api-response.utils';
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
import { safeImportModule } from 'src/utils/module-loader';
import { BlockAllGuard } from 'src/utils/block.guard';

let ActiveAuthGuard: any;

const scaffoldModule = safeImportModule('scaffolding/scaffold.module');

if (scaffoldModule) {
  try {
    const { JwtAuthGuard } = require('../../scaffolding/user/auth/jwt-auth.guard');
    ActiveAuthGuard = JwtAuthGuard;
  } catch (err) {
    console.warn(
      'Failed to load JwtAuthGuard, using fallback:',
      err.message,
    );
    ActiveAuthGuard = BlockAllGuard;
  }
} else {
  ActiveAuthGuard = BlockAllGuard;
}

@UseGuards(ActiveAuthGuard)
@Controller('visualization')
export class VisualizationController {
  private readonly logger = new Logger(VisualizationController.name);

  constructor(private readonly visualizationService: VisualizationService) {}

  @Get('copernicus')
  async getAllCopernicusData(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;
      const parsedOffset = offset ? parseInt(offset, 10) : undefined;

      if (limit && isNaN(parsedLimit)) {
        throw new BadRequestException('Invalid limit parameter');
      }

      if (offset && isNaN(parsedOffset)) {
        throw new BadRequestException('Invalid offset parameter');
      }

      const result = await this.visualizationService.getAllCopernicusData(
        parsedLimit,
        parsedOffset,
      );
      return new ApiResponse(
        result,
        'Copernicus data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetAllCopernicusData',
      );
    }
  }

  @Get('copernicus/by-hour')
  async getDataByRoundedHour(@Query('time') time: string) {
    try {
      if (!time) {
        throw new BadRequestException('Time parameter is required');
      }

      const inputTime = new Date(time);

      if (isNaN(inputTime.getTime())) {
        throw new BadRequestException(
          'Invalid time format. Use ISO 8601 format (e.g., 2024-01-01T14:30:00Z)',
        );
      }

      const result =
        await this.visualizationService.getDataByRoundedHour(inputTime);

      return new ApiResponse(
        result,
        'Data fetched successfully for rounded hour',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetDataByRoundedHour',
      );
    }
  }

  @Get('copernicus/date-range')
  async getCopernicusDataByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      if (!startDate || !endDate) {
        throw new BadRequestException(
          'Both startDate and endDate are required',
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format');
      }

      const result =
        await this.visualizationService.getCopernicusDataByDateRange(
          start,
          end,
        );

      return new ApiResponse(
        result,
        'Copernicus data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetCopernicusDataByDateRange',
      );
    }
  }

  @Get('copernicus/location')
  async getCopernicusDataByLocation(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('tolerance') tolerance?: string,
  ) {
    try {
      if (!latitude || !longitude) {
        throw new BadRequestException(
          'Both latitude and longitude are required',
        );
      }

      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const tol = tolerance ? parseFloat(tolerance) : 0.1;

      if (isNaN(lat) || isNaN(lon) || isNaN(tol)) {
        throw new BadRequestException(
          'Invalid latitude, longitude, or tolerance',
        );
      }

      const result =
        await this.visualizationService.getCopernicusDataByLocation(
          lat,
          lon,
          tol,
        );

      return new ApiResponse(
        result,
        'Copernicus data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetCopernicusDataByLocation',
      );
    }
  }

  @Get('copernicus/t2m-averaged')
  async getAveragedT2mByMonth(@Query('month') month: string) {
    try {
      if (!month) {
        throw new BadRequestException(
          'Month parameter is required. Format: YYYY-MM (e.g., 2022-06)',
        );
      }

      // Validate format YYYY-MM
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        throw new BadRequestException(
          'Invalid month format. Use YYYY-MM format (e.g., 2022-06)',
        );
      }

      const result =
        await this.visualizationService.getAveragedT2mByMonth(month);

      return new ApiResponse(
        result,
        'Averaged t2m data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetAveragedT2mByMonth',
      );
    }
  }

  @Get('copernicus/:id')
  async getCopernicusDataById(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.visualizationService.getCopernicusDataById(id);

      if (!result) {
        return new ApiResponse(null, 'Copernicus data not found', 404);
      }

      return new ApiResponse(
        result,
        'Copernicus data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetCopernicusDataById',
      );
    }
  }

  @Get('statistics')
  async getDataStatistics() {
    try {
      const result = await this.visualizationService.getDataStatistics();
      return new ApiResponse(result, 'Statistics fetched successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetDataStatistics',
      );
    }
  }

  // ----------------------- dk_khis endpoints -----------------------

  @Get('dk_khis')
  async getAllDkKhisData(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;
      const parsedOffset = offset ? parseInt(offset, 10) : undefined;

      if (limit && isNaN(parsedLimit)) {
        throw new BadRequestException('Invalid limit parameter');
      }

      if (offset && isNaN(parsedOffset)) {
        throw new BadRequestException('Invalid offset parameter');
      }

      const result = await this.visualizationService.getAllDkKhisData(
        parsedLimit,
        parsedOffset,
      );
      return new ApiResponse(result, 'DkKhis data fetched successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetAllDkKhisData',
      );
    }
  }

  // ----------------------- dk_prompts endpoints -----------------------
  @Get('dk_prompts')
  async getAllDkPromptsData(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;
      const parsedOffset = offset ? parseInt(offset, 10) : undefined;

      if (limit && isNaN(parsedLimit)) {
        throw new BadRequestException('Invalid limit parameter');
      }

      if (offset && isNaN(parsedOffset)) {
        throw new BadRequestException('Invalid offset parameter');
      }

      const result = await this.visualizationService.getAllDkPromptsData(
        parsedLimit,
        parsedOffset,
      );
      return new ApiResponse(
        result,
        'DkPrompts data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetAllDkPromptsData',
      );
    }
  }

  // ----------------------- dk_kajiado_health_facility_list endpoints -----------------------
  @Get('dk_kajiado_health_facility_list')
  async getAllDkKajiadoHealthFacilityListData(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;
      const parsedOffset = offset ? parseInt(offset, 10) : undefined;

      if (limit && isNaN(parsedLimit)) {
        throw new BadRequestException('Invalid limit parameter');
      }

      if (offset && isNaN(parsedOffset)) {
        throw new BadRequestException('Invalid offset parameter');
      }

      const result =
        await this.visualizationService.getAllDkKajiadoHealthFacilityListData(
          parsedLimit,
          parsedOffset,
        );
      return new ApiResponse(
        result,
        'DkKajiadoHealthFacilityList data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetAllDkKajiadoHealthFacilityListData',
      );
    }
  }

  // ----------------------- kajiado_ward_geometry endpoints -----------------------
  @Get('kajiado-wards')
  async getKajiadoWardGeometryAsGeoJSON() {
    try {
      const result =
        await this.visualizationService.getKajiadoWardGeometryAsGeoJSON();
      return new ApiResponse(
        result,
        'Kajiado ward geometry fetched as GeoJSON successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetKajiadoWardGeometryAsGeoJSON',
      );
    }
  }

  @Get('kajiado-wards/choropleth')
  async getKajiadoWardChoroplethData(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : undefined;
      const parsedOffset = offset ? parseInt(offset, 10) : undefined;

      if (limit && isNaN(parsedLimit)) {
        throw new BadRequestException('Invalid limit parameter');
      }

      if (offset && isNaN(parsedOffset)) {
        throw new BadRequestException('Invalid offset parameter');
      }

      const result =
        await this.visualizationService.getKajiadoWardChoroplethData(
          parsedLimit,
          parsedOffset,
        );
      return new ApiResponse(
        result,
        'Kajiado ward choropleth data fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> GetKajiadoWardChoroplethData',
      );
    }
  }
}
