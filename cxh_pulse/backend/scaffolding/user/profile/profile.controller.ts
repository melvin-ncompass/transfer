import { ProfileSwagger } from './swagger/profile.swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  Logger,
  Req,
  UploadedFile,
  BadRequestException,
  UseInterceptors,
  Res,
} from '@nestjs/common';

import { ApiResponse } from 'scaffolding/common/api-response/api-response.utils';
import { PermissionsGuard } from 'scaffolding/common/guards/permissions.guards';
import { Permissions } from 'scaffolding/common/decorators/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { CustomStorageEngine } from 'scaffolding/common/storage/custom-storage.engine';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { throwServiceError } from 'scaffolding/common/error-handler/error-handler.utils';
import { ProfileService } from './profile.service';
import { SettingsService } from 'scaffolding/settings/settings.service';
import {
  UpdateUserDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  CheckResetTokenDto,
} from './dto/profile.dto';
import { SwaggerEndpoint } from 'src/utils/swagger/custom-swagger.decorator';

@Controller('users')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly settingsService: SettingsService,
  ) { }

  @Get('me')
  @SwaggerEndpoint(ProfileSwagger, 'GET_PROFILE')
  @UseGuards(JwtAuthGuard)
  // @Permissions(PermissionEnum.MANAGE_PROFILE)
  async getProfile(@Req() req) {
    try {
      const userId = req.user['userId'];
      const result = await this.profileService.findById(userId);
      return new ApiResponse(result, 'Profile fetched successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> Me');
    }
  }

  @Put()
  @SwaggerEndpoint(ProfileSwagger, 'UPDATE_USER_PROILE')
  @UseGuards(JwtAuthGuard)
  // @Permissions(PermissionEnum.MANAGE_PROFILE)
  async updateUser(@Body() dto: UpdateUserDto, @Req() req) {
    try {
      const userId = req.user['userId'];

      const result = await this.profileService.updateUser(userId, dto);
      return new ApiResponse(result, 'User updated successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> Update');
    }
  }

  @Put('change-password')
  @SwaggerEndpoint(ProfileSwagger, 'CHANGE_PASSWORD')
  @UseGuards(JwtAuthGuard)
  // @Permissions(PermissionEnum.MANAGE_PROFILE)
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req) {
    try {
      const result = await this.profileService.changePassword(
        req.user['userId'],
        dto,
      );
      return new ApiResponse(result, 'Password changed successfully', 200);
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> ChangePassword');
    }
  }

  @Post('change-profile-pic')
  @SwaggerEndpoint(ProfileSwagger, 'CHANGE_PROFILE_PIC')
  @UseGuards(JwtAuthGuard)
  async changeProfilePic(@Req() req, @Res() res) {
    try {
      const storage = new CustomStorageEngine(this.settingsService);
      const upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            return cb(null, false);
          }
          cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
      }).single('file');

      await new Promise<void>((resolve, reject) => {
        upload(req, res, async (err) => {
          if (err) return reject(err);
          try {
            const userId = req.user['userId'];
            const result = await this.profileService.changeProfilePic(
              req.file,
              userId,
            );
            res.json(
              new ApiResponse(
                result,
                'Profile picture changed successfully',
                200,
              ),
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> ChangeProfilePic');
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @Put('remove-profile-pic')
  // async removeProfilePic(@Req() req) {
  //   console.log(req.user);
  //   const userId = req.user['userId'];
  //   console.log(`Controller: removeProfilePic called for userId: ${userId}`);
  //   return this.userService.removeProfilePic(userId);
  // }

  @Delete('remove-profile-pic')
  @SwaggerEndpoint(ProfileSwagger, 'REMOVE_PROFILE_PIC')
  @UseGuards(JwtAuthGuard)
  // @Permissions(PermissionEnum.MANAGE_PROFILE)
  async removeProfilePic(@Req() req) {
    try {
      const userId = req.user['userId']; // or req.user['userId'] if mapped
      const result = await this.profileService.removeProfilePic(userId);
      return new ApiResponse(
        result,
        'Profile picture removed successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(error, this.logger, 'User -> RemoveProfilePic');
    }
  }

  @Get('profile-pic')
  @SwaggerEndpoint(ProfileSwagger, 'GET_PROFILE_PIC')
  @UseGuards(JwtAuthGuard)
  // @Permissions(PermissionEnum.MANAGE_PROFILE)
  async getProfilePic(@Req() req, @Res() res) {
    try {
      const userId = req.user['userId'];
      const result = await this.profileService.getProfilePic(userId, res);
      return new ApiResponse(
        result,
        'Profile picture retrieved successfully',
        200,
      );
    } catch (error) {
      return throwServiceError(error, this.logger, `Profile -> GetProfilePic`);
    }
  }

  // --------------------- forget password ------------------------

  @Post('forgot-password')
  @SwaggerEndpoint(ProfileSwagger, 'FORGOT_PASSWORD')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    try {
      await this.profileService.sendResetLink(dto.email);
      return { message: 'Reset link sent successfully' };
    } catch (error) {
      return throwServiceError(error, this.logger, `Profile -> GetProfilePic`);
    }
  }

  @Post('reset-password')
  @SwaggerEndpoint(ProfileSwagger, 'RESET_PASSWORD')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      await this.profileService.resetPassword(dto.token, dto.newPassword);
      return { message: 'Password updated successfully' };
    } catch (error) {
      return throwServiceError(error, this.logger, `Profile -> ResetPassword`);
    }
  }

  @Post('check-reset-token')
  @SwaggerEndpoint(ProfileSwagger, 'CHECK_RESET_TOKEN')
  async checkResetToken(@Body() dto: CheckResetTokenDto) {
    try {
      await this.profileService.checkResetToken(dto.token);
      return { message: 'Reset token is valid' };
    } catch (error) {
      return throwServiceError(
        error,
        this.logger,
        `Profile -> CheckResetToken`,
      );
    }
  }
}
