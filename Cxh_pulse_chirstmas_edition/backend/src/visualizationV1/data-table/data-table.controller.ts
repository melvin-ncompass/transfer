import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { DataTableService } from './data-table.service';
import { DataTableFilterDto } from './dto/data-table.dto';
import { JwtAuthGuard } from 'scaffolding/user/auth/jwt-auth.guard';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { ApiResponse } from 'src/utils/api-response/api-response.utils';
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
// import { CreateDatumDto } from './dto/data.dto';
// import { UpdateDatumDto } from './dto/update-datum.dto';

@Controller('visualization/dataTable')
export class DataTableController {
  private readonly logger = new Logger(DataTableController.name);

  constructor(private readonly dataTableService: DataTableService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_DATA)
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
