import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { PromptsSwagger } from './swagger/prompts.swagger';
import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ApiExtraModels } from '@nestjs/swagger';
import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { BlockAllGuard } from "src/utils/block.guard";
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
import { EachIntentTrendFilterDto, PromptsIntentPriorityFrequencyDto, PromptsIntentRelativeIntensityDto, PromptsRiskDto } from '../dto/visualization.dto';
import { PromptsService } from './prompts.service';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';

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
@Permissions(PermissionEnum.MANAGE_PROMPTS)
@Controller('visualizationV1/prompts')
export class PromptsController {
  private readonly logger = new Logger(PromptsService.name);
  constructor(private readonly promptsService: PromptsService) { }

  @Get('riskTreeMap')
  @ApiExtraModels(PromptsRiskDto)
  @SwaggerEndpoint(PromptsSwagger, 'RISK_TREE_MAP')
  async getRiskTreeMap(@Query() filters: PromptsRiskDto) {
    try {
      const result = await this.promptsService.getRiskTreeMap(filters);
      return new ApiResponse(result, 'Fetched risk tree map successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'Visualization -> getRiskTreeMap',
      );
    }
  }

  @Get('intentRelativeIntensity')
  @ApiExtraModels(PromptsIntentRelativeIntensityDto)
  @SwaggerEndpoint(PromptsSwagger, 'INTENT_RELATIVE_INTENSITY')
  async getPromptsIntentRelativeIntensity(
    @Query() filters: PromptsIntentRelativeIntensityDto,
  ) {
    try {
      const result =
        await this.promptsService.getPromptsIntentRelativeIntensity(
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

  @Get('intentPriorityFrequency')
  @ApiExtraModels(PromptsIntentPriorityFrequencyDto)
  @SwaggerEndpoint(PromptsSwagger,'INTENT_PRIORITY_FREQUENCY')
  async getPromptsIntentPriorityFrequency(
    @Query() filters: PromptsIntentPriorityFrequencyDto,
  ) {
    try {
      const result =
        await this.promptsService.getPromptsIntentPriorityFrequency(
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

}
