import { Controller, Get, Headers, UseGuards, Query, Body, Post } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { ProducerService } from 'src/rmq/producer.service';
import { ActivityService } from './activity.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ActivityFilterDto } from './dto/activity-filter.dto';
import { GetCookie } from 'src/common/decorators/get-cookies.decorator';
import { ExportActivityFilterDto } from './dto/export-activity-filter.dto';
import { ActivityMeta } from 'src/common/decorators/ignore-interceptor.decorator';

@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly producerService: ProducerService,
    private readonly activityService: ActivityService,

  ) { }


  @Get('filter')
  async getActivities(
    @Query() filters: ActivityFilterDto,
    @GetCookie('companyId') companyId: string,
  ) {
    const filteredData = await this.activityService.getActivitiesWithFilters(filters, companyId);
    return {
      message: 'Activity logs fetched successfully!',
      data: filteredData,
    };
  }

  @ActivityMeta({
    module: 'Settings',
    feature: 'Activity',
    status: 'Export',
  })
  @Post('export')
  async getActivitiesReport(
    @CurrentUser('email') email: string,
    @GetCookie('companyId') companyId: string,
    @Body() filters: ExportActivityFilterDto
  ) {
    await this.producerService.addToFileGenerationQueue({
      companyId,
      filters,
      email
    });

    return {
      message: 'Report will be emailed shortly.'
    };
  }

  @Get('display_names')
  async getUserDisplayNames(
    @GetCookie("companyId") companyId: string,
  ) {
    const fetchedData = await this.activityService.getUserDisplayNames(companyId);

    return {
      message: 'User display names fetched successfully',
      data: fetchedData,
    };
  }

  @Get('get_features_modules')
  async getAvailableOptions(@GetCookie('companyId') companyId: string) {
    const fetchedData = await this.activityService.getAvailableModulesAndFeatures(companyId);
    return {
      message: 'Modules and Features fetched successfully',
      data: fetchedData,
    };
  }
}
