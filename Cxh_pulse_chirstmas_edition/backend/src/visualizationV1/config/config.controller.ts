import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Logger,
  UseGuards,
  Put
} from '@nestjs/common';
import { UpsertConfigDto } from './dto/config.dto';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from 'scaffolding/user/auth/jwt-auth.guard';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { ApiResponse } from 'src/utils/api-response/api-response.utils';
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
@Controller('visualization/config')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);
  constructor(private readonly configService: ConfigService) { }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @Permissions(PermissionEnum.MANAGE_CONFIG)
  async createConfig(@Body() upsertConfigDto: UpsertConfigDto) {
    try {
      const result = await this.configService.upsertConfig(upsertConfigDto);
      return new ApiResponse(result, 'Config setting created successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'Config Setting -> Create');
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  @Permissions(PermissionEnum.MANAGE_CONFIG)
  async findAll() {
    try {
      const result = await this.configService.findAllConfig();
      return new ApiResponse(result, 'Config settings fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'Config Setting -> get All Config Settings');
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get(':identifier')
  @Permissions(PermissionEnum.MANAGE_CONFIG)
  async findOne(@Param('identifier') identifier: string) {
    try {
      const result = await this.configService.findConfigByParameter(identifier);
      return new ApiResponse(result, 'Config setting fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, `Config Setting -> get Config Setting by Parameter`);
    }
  }
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Put(':parameterName')
  // @Permissions(PermissionEnum.MANAGE_SETTINGS)
  // async updateConfig(@Param('parameterName') parameterName: string, @Body() updateConfigDto: UpdateConfigDto) {
  //   try {
  //     const result = await this.configService.updateConfig(parameterName, updateConfigDto);
  //     return new ApiResponse(result, 'Config setting updated successfully', 200);
  //   } catch (error) {
  //     return throwServiceError(error, this.logger, `Config Setting -> Update Config Setting`);
  //   }
  // }

//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Delete(':identifier')
//   @Permissions(PermissionEnum.MANAGE_SETTINGS)
//   async softDeleteConfig(@Param('identifier') identifier: string) {
//     try {
//       const result = await this.configService.softDeleteConfig(identifier);
//       return new ApiResponse(result, 'Config setting soft deleted successfully', 200);
//     } catch (error) {
//       return throwServiceError(error, this.logger, `Config Setting -> Soft Delete Config Setting`);
//     }
//   }

//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Delete('hard/:identifier')
//   @Permissions(PermissionEnum.MANAGE_SETTINGS)
//   async deleteConfig(@Param('identifier') identifier: string) {
//     try {
//       const result = await this.configService.deleteConfig(identifier);
//       return new ApiResponse(result, 'Config setting deleted successfully', 200);
//     } catch (error) {
//       return throwServiceError(error, this.logger, `Config Setting -> Delete Config Setting`);
//     }
//   }
 }
