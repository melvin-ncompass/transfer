import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  UseGuards
} from '@nestjs/common';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { PermissionEnum } from 'scaffolding/common/enum/enum';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { JwtAuthGuard } from 'scaffolding/user/auth/jwt-auth.guard';
import { ApiResponse } from 'src/utils/api-response/api-response.utils';
import { throwServiceError } from 'src/utils/error-handler/error-handler.utils';
import { SwaggerEndpoint } from '../../utils/swagger/custom-swagger.decorator';
import { ConfigService } from './config.service';
import { UpsertConfigDto } from './dto/config.dto';
import { ConfigSwagger } from './swagger/config.swagger';
@Controller('visualization/config')
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);
  constructor(private readonly configService: ConfigService) { }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @Permissions(PermissionEnum.MANAGE_CONFIG)
  @SwaggerEndpoint(ConfigSwagger, 'UPSERT_CONFIG')
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
  @SwaggerEndpoint(ConfigSwagger, 'GET_ALL_CONFIG')
  async findAll() {
    try {
      const result = await this.configService.findAllConfig();
      return new ApiResponse(result, 'Config settings fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'Config Setting -> get All Config Settings');
    };
  }

  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Get(':identifier')
  // @Permissions(PermissionEnum.MANAGE_CONFIG)
  // @SwaggerEndpoint({
  //   summary: 'Get config setting',
  //   description: 'Fetch a configuration setting with threshold values by identifier',
  //   tags: ['Not in use'],
  //   bearerAuth: true,
  //   params: [
  //     {
  //       name: 'identifier',
  //       type: String
  //     }
  //   ],
  //   responses: [
  //     {
  //       status: 200,
  //       description: 'Config setting fetched successfully',
  //       dataType: ConfigResponseDto

  //     },
  //     {
  //       status: 400,
  //       description: 'Config setting does not exist',
  //     },
  //     {
  //       status: 403,
  //       description: 'Forbidden - Insufficient permissions',
  //     },
  //   ],
  // })
  // async findOne(@Param('identifier') identifier: string) {
  //   try {
  //     const result = await this.configService.findConfigByParameter(identifier);
  //     return new ApiResponse(result, 'Config setting fetched successfully', 200);
  //   } catch (error) {
  //     return throwServiceError(error, this.logger, `Config Setting -> get Config Setting by Parameter`);
  //   }
  // }
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
