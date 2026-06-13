import { SwaggerEndpoint } from '../../utils/swagger/custom-swagger.decorator';
import { DataTableSwagger } from './swagger/data-table.swagger';
import {
  Controller,
  Get,
  Logger,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiExtraModels } from '@nestjs/swagger';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { JwtAuthGuard } from 'scaffolding/user/auth/jwt-auth.guard';
import { ApiResponse } from 'src/utils/api-response/api-response.utils';
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
import { DataTableService } from './data-table.service';
import { DataTableFilterDto } from './dto/data-table.dto';

// import { CreateDatumDto } from './dto/data.dto';
// import { UpdateDatumDto } from './dto/update-datum.dto';

@Controller('visualization/dataTable')
export class DataTableController {
  private readonly logger = new Logger(DataTableController.name);

  constructor(private readonly dataTableService: DataTableService) { }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_DATA)
  @ApiExtraModels(DataTableFilterDto)
  @SwaggerEndpoint(DataTableSwagger, 'GET_DATA_TABLE')
  async getAllDataTable(@Query() filters: DataTableFilterDto) {
    try {
      const result = await this.dataTableService.getAllDataTable(filters);
      return new ApiResponse(result, 'DataTable fetched successfully', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'DataTable -> get All DataTable',
      );
    }
  }

  //   async exportData(@Res() res: Response) {
  //     try {
  //       const csvBuffer = await this.dataTableService.exportHealthDataCsv();
  //       res.setHeader('Content-Type', 'text/csv');
  //       res.setHeader(
  //         'Content-Disposition',
  //         'attachment; filename="health_data.csv"', // Suggests a default filename
  //       );
  //       //res.setHeader('Content-Length', csvBuffer.length);
  //       res.status(HttpStatus.OK).send(csvBuffer);
  //     } catch (error) {
  //       console.error('Error during CSV export:', error);
  //       res
  //         .status(HttpStatus.INTERNAL_SERVER_ERROR)
  //         .send('Failed to generate report.');
  //     }
  //   }
}
