import { ApiExtraModels } from '@nestjs/swagger';
import { UserSwagger } from './swagger/user.swagger';
import { ArchiveStatus } from './../common/enum/enum';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
  ParseIntPipe,
  Req,
  Put,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { throwServiceError } from '../common/error-handler/error-handler.utils';

import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { pagination } from 'scaffolding/common/pagination/pagination';
import { PermissionEnum, UserStatus } from 'scaffolding/common/enum/enum';
import { PaginationDto } from 'scaffolding/common/pagination/dto/pagination.dto';
import {
  CreateUserDto,
  PaginatedUserFilterDto,
  UpdateUserRoleDto,
} from './dto/user.dto';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';
import {
  UserMemberDto,
  InviteMemberDto,
  RequestMemberDto,
  GetUsersNonPaginatedResponseDto,
  GetUsersPaginatedResponseDto,
} from './dto/swagger-response.dto';

// import { File } from 'multer';

export interface viewAll extends PaginatedUserFilterDto {
  status?: ArchiveStatus;
}

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post()
  @SwaggerEndpoint(UserSwagger, 'CREATE_USER')
  async createUser(@Body() dto: CreateUserDto) {
    try {
      const result = await this.userService.createUser(dto);
      return new ApiResponse(result, 'User created successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> Create');
    }
  }

  @Get('getAll')
  @ApiExtraModels(GetUsersNonPaginatedResponseDto, GetUsersPaginatedResponseDto)
  @SwaggerEndpoint(UserSwagger, 'GET_USER')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USERS)
  async getAllUsers(@Query() query: viewAll) {
    try {
      if (query.limit && query.page) {
        const { users, total } = await this.userService.getAllUsers(query);
        return pagination(users, total, query, 'Users fetched successfully');
      }
      const result = await this.userService.getAllUsers(query);
      return new ApiResponse(result, 'Users fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> GetAll');
    }
  }

  // @Delete('delete')
  // @UseGuards(JwtAuthGuard)
  // async softDeleteUser(@Param('id', ParseIntPipe) id: number) {
  //   try {
  //     const result = await this.userService.softDeleteUser(id);
  //     return new ApiResponse(result, 'User soft-deleted successfully', 200);
  //   } catch (error) {
  //     return throwServiceError(error, this.logger, 'User -> SoftDelete');
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @Post(':id/restore')
  @SwaggerEndpoint(UserSwagger, 'RESTORE_USER')
  async restoreUser(@Param('id') id: string) {
    try {
      const result = await this.userService.restoreUser(id);
      return new ApiResponse(result, 'User restored successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> Restore');
    }
  }

  // --------------- new users endpoints --------------------
  @Get('getAllUsers')
  @ApiExtraModels(UserMemberDto, InviteMemberDto, RequestMemberDto)
  @SwaggerEndpoint(UserSwagger, 'GET_ALL_USERS')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USERS)
  async getAllUsersV2(@Query() query: viewAll) {
    try {
      if (query.limit && query.page) {
        const { flattened_users, total, userCount } =
          (await this.userService.getAllUsersV2(query)) as {
            flattened_users: any[];
            total: number;
            userCount?: Record<string, any>;
          };
        return pagination(
          flattened_users,
          total,
          query,
          'Users fetched successfully',
          {
            userCount: userCount,
          },
        );
      }
      const result = await this.userService.getAllUsersV2(query);
      return new ApiResponse(result, 'Users fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> GetAll');
    }
  }

  @Put('role')
  @SwaggerEndpoint(UserSwagger, 'UPDATE_USER_ROLE')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_ROLES)
  async updateUserRole(@Body() dto: UpdateUserRoleDto) {
    try {
      const result = await this.userService.updateUserRoleByEmail(dto);
      return new ApiResponse(result, 'User role updated successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> UpdateUserRole');
    }
  }

  @Patch('deactivate/:email')
  @SwaggerEndpoint(UserSwagger, 'DEACTIVATE_USER')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USERS)
  async deactivateUser(@Param('email') email: string) {
    try {
      const result = await this.userService.deactivateUser(email);
      return new ApiResponse(result, `User deactivated successfully`, 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> Deactivate');
    }
  }

  @Patch('activate/:email')
  @SwaggerEndpoint(UserSwagger, 'ACTIVATE_USER')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USERS)
  async activateUser(@Param('email') email: string) {
    try {
      const result = await this.userService.activateUser(email);
      return new ApiResponse(result, `User activated successfully`, 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> Activate');
    }
  }

  @Delete()
  @SwaggerEndpoint(UserSwagger, 'HARD_DELETE_USER')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USERS)
  async DeleteUser(@Body('emails') emails: string[]) {
    try {
      const result = await this.userService.hardDeleteUser(emails);
      return new ApiResponse(result, 'User hard-deleted successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> HardDelete');
    }
  }
}
