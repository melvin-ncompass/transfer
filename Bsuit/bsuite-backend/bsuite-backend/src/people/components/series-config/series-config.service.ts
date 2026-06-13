import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrUpdateSeriesConfigDto } from './dto/create-update-series-config.dto';
import { DataSource, In } from 'typeorm';
import { SeriesConfig, SeriesName } from './entities/tenant.series-config.entity';


@Injectable()
export class SeriesConfigService {

  async create(dataSource: DataSource, createSeriesConfig: CreateOrUpdateSeriesConfigDto) {
    const seriesConfigRepo = dataSource.getRepository(SeriesConfig);
    const existingPrefixes = await this.findAll(dataSource);
    if (existingPrefixes) { 
      throw new BadRequestException('Series Configuration already exists!');
    }

    const prefixes = seriesConfigRepo.create([
    {
      seriesPrefix: createSeriesConfig.seriesPrefixPermanent,
      seriesName: SeriesName.PERMANENT,
    },
    {
      seriesPrefix: createSeriesConfig.seriesPrefixIntern,
      seriesName: SeriesName.INTERN,
    },
    ]);

    return {
      data: await seriesConfigRepo.save(prefixes),
      change_of_data: {
        module: "Payroll",
        feature: "Series Configuration",
        status: 'Create'
      }
    }
  }
  
  async update(dataSource: DataSource,updateSeriesConfig: CreateOrUpdateSeriesConfigDto) { 
    const seriesConfigRepo = dataSource.getRepository(SeriesConfig);
    if (!!updateSeriesConfig.seriesPrefixPermanent !==  !!updateSeriesConfig.seriesPrefixIntern) { 
      throw new BadRequestException('Both IDs must be provided to update the series configuration');
    }
    await seriesConfigRepo.update(
      {
        seriesName: SeriesName.PERMANENT
      },
      {
        seriesPrefix: updateSeriesConfig.seriesPrefixPermanent
      }
    );
    await seriesConfigRepo.update(
      {
        seriesName: SeriesName.INTERN,
      },
      {
        seriesPrefix: updateSeriesConfig.seriesPrefixIntern
      }
    );
    return {
      data: await this.findAll(dataSource),
      change_of_data: {
        module: "Payroll",
        feature: "Series Configuration",
        status: 'Update'
      }
    }
  }

  async findAll(dataSource: DataSource) {
    const seriesConfigRepo = dataSource.getRepository(SeriesConfig);
    return await seriesConfigRepo.find()
  }

  async delete(dataSource: DataSource) {
    const seriesConfigRepo = dataSource.getRepository(SeriesConfig);

    await seriesConfigRepo.deleteAll();
    return {
      change_of_data: {
        module: "Payroll",
        feature: "Series Configuration",
        status: "Delete",
      }
    }
}
}
