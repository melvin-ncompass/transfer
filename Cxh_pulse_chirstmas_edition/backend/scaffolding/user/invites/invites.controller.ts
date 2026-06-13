import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';

import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { throwServiceError } from 'scaffolding/common/error-handler/error-handler.utils';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';

import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { InvitesService } from './invites.service';
import {
  AcceptInviteDto,
  CreateUserFromInviteDto,
  InviteUserDto,
  ReinviteUserDto,
} from './dto/invites.dto';
import { CheckInviteDto } from '../signup-request/dto/signup-request.dto';
import { PermissionEnum } from 'scaffolding/common/enum/enum';

@Controller('users')
export class InvitesController {
  private readonly logger = new Logger(InvitesController.name);

  constructor(private readonly invitesService: InvitesService) {}

  // only admin and super admin
  @Post('invite')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USER)
  async inviteUser(@Body() invite: InviteUserDto, @Req() req) {
    try {
      const invitedBy = req.user['userId'];
      const result = await this.invitesService.inviteUser(invite, invitedBy);
      return new ApiResponse(result, 'User invited successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> InviteUser');
    }
  }

  // only admin and super admin
  @Get('invites')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USER)
  async getAllInvites() {
    try {
      const result = await this.invitesService.getAllInvites();
      return new ApiResponse(result, 'All invites fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> GetAllInvites');
    }
  }

  @Post('invite/check')
  async checkInvite(@Body() dto: CheckInviteDto) {
    try {
      const result = await this.invitesService.checkInvite(dto);
      return new ApiResponse(result, 'Invite status retrieved', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> CheckInvite');
    }
  }

  @Post('invite/accept')
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    try {
      const result = await this.invitesService.acceptInvite(dto);
      return new ApiResponse(result, 'Invite accepted successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> AcceptInvite');
    }
  }

  @Post('invite/onboard')
  async createUserFromInvite(@Body() dto: CreateUserFromInviteDto) {
    try {
      const result = await this.invitesService.createUserFromInvite(
        dto.userInfoId,
        dto.password,
      );
      return new ApiResponse(result, 'User created successfully', 201);
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        'User -> CreateUserFromInvite',
      );
    }
  }

  @Post('reinvite')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionEnum.MANAGE_USER)
  async resendInvite(@Body() dto: ReinviteUserDto, @Req() req) {
    try {
      const invitedBy = req.user['userId'];
      const result = await this.invitesService.resendInvite(
        dto.email,
        invitedBy,
      );
      return new ApiResponse(result, 'Re-invite sent successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> ResendInvite');
    }
  }
}
