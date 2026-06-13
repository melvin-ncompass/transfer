import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {  SeriesConfigService } from './series-config.service';
import { CompanyDB } from 'src/common/decorators/get-db.decorator';
import { CompanyGuard } from 'src/common/guard/company.guard';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { DataSource } from 'typeorm';
import { CreateOrUpdateSeriesConfigDto } from './dto/create-update-series-config.dto';

@UseGuards(JwtAuthGuard, CompanyGuard)
@Controller('series_config')
export class  SeriesConfigController {
  constructor(private readonly  seriesConfigService:  SeriesConfigService) {}

  @Post()
  async create(
    @CompanyDB() dataSource: DataSource,
    @Body() prefixDetails: CreateOrUpdateSeriesConfigDto
  ) {
    
    return {
      data: await this.seriesConfigService.create(dataSource, prefixDetails),
      message: `Successfully created the Employee ID Prefix Configurations`
    }
  }

  @Get()
  async findAll(@CompanyDB() dataSource: DataSource) {
    return {
      data: await this.seriesConfigService.findAll(dataSource),
      message: 'Successfully fetched all Employee ID Prefix Configurations'
    }
  }

  @Patch()
  async update(@CompanyDB() dataSource: DataSource, @Body() prefixDetails: CreateOrUpdateSeriesConfigDto) { 
    return {
      data: await this.seriesConfigService.update(dataSource, prefixDetails),
      message: 'Successfully updated all Employee ID Prefix Configurations'
    }
  }

  @Delete()
  async deleteMany(
    @CompanyDB() dataSource: DataSource) {
    await this.seriesConfigService.delete(dataSource);
    return {
      message: `Successfully deleted Employee ID Prefix Configurations`
    };
  }

}
