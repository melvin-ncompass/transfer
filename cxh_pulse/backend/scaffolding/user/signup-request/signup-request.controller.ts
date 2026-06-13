import { SignupSwagger } from './swagger/signup-request.swagger';
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';

import { throwServiceError } from 'scaffolding/common/error-handler/error-handler.utils';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { SignupRequestService } from './signup-request.service';
import { PermissionEnum } from 'scaffolding/common/enum/enum';
import {
  CreateUserRequestDto,
  ProcessRequestDto,
  CheckRequestDto,
  CreateUserFromRequestDto,
} from './dto/signup-request.dto';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';

@Controller('users')
export class SignupRequestController {
  private readonly logger = new Logger(SignupRequestController.name);
  constructor(private readonly signupRequestService: SignupRequestService) {}

  @Post('request')
  @SwaggerEndpoint(SignupSwagger, 'CREATE_USER_FROM_REQUEST')
  async createUserRequest(@Body() userRequest: CreateUserRequestDto) {
    try {
      const result =
        await this.signupRequestService.createUserRequest(userRequest);
      return new ApiResponse(
        result,
        'User request submitted successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'SignupRequest -> CreateUserRequest',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('request')
  @SwaggerEndpoint(SignupSwagger, 'GET_USER_REQUEST')
  async getAllRequests() {
    try {
      const result = await this.signupRequestService.getAllRequests();
      return new ApiResponse(
        result,
        'All user requests fetched successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'SignupRequest -> GetAllRequests',
      );
    }
  }

  @Post('request/process')
  @SwaggerEndpoint(SignupSwagger, 'PROCESS_USER_REQUEST')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USERS)
  async processRequest(@Body() dto: ProcessRequestDto, @Req() req) {
    try {
      const processedBy = req.user['userId'];
      const result = await this.signupRequestService.processUserRequest(
        dto.requestId,
        processedBy,
        dto.status,
      );
      return new ApiResponse(result, 'Request has been processed', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'SignupRequest -> ProcessRequest',
      );
    }
  }

  @Post('request/check')
  @SwaggerEndpoint(SignupSwagger, 'CHECK_REQUEST')
  async checkRequest(@Body() dto: CheckRequestDto) {
    try {
      const result = await this.signupRequestService.checkRequest(dto);
      return new ApiResponse(result, 'Request status retrieved', 200);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'SignupRequest -> CheckRequest',
      );
    }
  }

  @Post('request/onboard')
  @SwaggerEndpoint(SignupSwagger, 'REQUEST_ONBOARD')
  async createUserFromRequest(@Body() dto: CreateUserFromRequestDto) {
    try {
      const result = await this.signupRequestService.createUserFromRequest(
        dto.userInfoId,
      );
      return new ApiResponse(result, 'User created successfully', 201);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'SignupRequest -> CreateUserFromRequest',
      );
    }
  }
}
