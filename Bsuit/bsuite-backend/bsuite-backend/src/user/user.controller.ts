import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  Request,
  Delete,
  Patch,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guard/jwt.auth.guard';
import { ChangeDisplayNameDto } from './dto/chage-displayName.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthService } from 'src/auth/auth.service';
import { ParseStringPipe } from 'src/common/pipes/parse-string.pipe';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ignoreModuleClassInterceptor } from 'src/common/decorators/ignore-interceptor.decorator';

@ignoreModuleClassInterceptor()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile/')
  async profileHome(@CurrentUser('id') userId: number) {
    return await this.userService.profileHome(userId);
  }

  @Post('change_displayName')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: UserPayload, @Body() changeDisplayNameDto: ChangeDisplayNameDto) {
    const { displayName } = changeDisplayNameDto
    return {
      message: 'Successfully changed displayName',
      data: await this.userService.changeDisplayName(user, displayName)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return {
      message: 'successfully uploaded picture',
      data: await this.userService.uploadProfilePicture(file, req),
    };
  }

  @Post('send_recovery_email')
  async sendRecoveryEmail(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const email = req.cookies['email'];

    if (!email) {
      throw new NotFoundException('Email is required');
    }

    await this.userService.sendRecoveryEmail(email, req, res);

    return {
      message: 'Account Recovery email sent successfully!',
    };
  }

  @UseGuards(AuthGuard('recovery'))
  @Post('recovery/validate')
  validateRecoveryToken() {
    return { message: "Valid token!" }
  }


  @UseGuards(AuthGuard('recovery'))
  @Post('recovery_2fa')
  async recover2FA(
    @Request() req: any,
    @Body('password', ParseStringPipe) password: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const email = req.user.email;
    if (!email || !password) {
      throw new NotFoundException('Email and password are required');
    }

    const user = await this.userService.verifyPassword(email, password);

    const loginResponse = await this.authService.login(req, user, res, false);

    return {
      message: "Logged in successfully after password verification",
      data: loginResponse
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete_user_account')
  async deleteUserAccount(@CurrentUser('id') userId: number) {
    await this.userService.deleteUserAccount(userId);

    return {
      message: "User Account Deleted Successfully"
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('remove_profile_image')
  async removeProfileImage(@CurrentUser('id') userId: number) {
    await this.userService.removeProfileImage(userId);

    return {
      message: "Profile Image Removed Successfully"
    };
  }
}

