import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('users/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    const { accessToken, refreshToken, sessionId } =
      await this.authService.login(user);

    // const isProduction = this.configService.get('NODE_ENV') === 'production';

    const isHttps = req.protocol === 'https';
    const sameSite = isHttps ? 'None' : 'Strict';

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: isHttps,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // res.cookie('refresh_token', refreshToken, {
    //   httpOnly: true,
    //   secure: isProduction,
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    // res.cookie('session_id', sessionId, {
    //   httpOnly: true,
    //   secure: isProduction,
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    return { accessToken };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const refreshToken = req.cookies['refresh_token'];
    const sessionId = req.cookies['session_id'];

    if (!refreshToken || !sessionId) {
      throw new UnauthorizedException('Missing refresh token or session ID');
    }

    const payload = this.authService.decodeRefreshToken(refreshToken);
    const { sub: userId } = payload;

    const { accessToken } = await this.authService.refreshTokens(
      userId,
      sessionId,
      refreshToken,
    );
    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    const sessionId = req.cookies['session_id'];
    console.log('session id:', sessionId);
    if (!sessionId) {
      throw new UnauthorizedException('Missing session ID');
    }

    await this.authService.logout(sessionId);

    res.clearCookie('refresh_token');
    res.clearCookie('session_id');

    return { message: 'Logged out successfully' };
  }
}

// import {
//   Controller,
//   Post,
//   Body,
//   Req,
//   Res,
//   HttpStatus,
//   Logger,
//   HttpException,
//   NotFoundException,
// } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { Response, Request } from 'express';
// import { throwServiceError } from '../../common/error-handler/error-handler.utils';
// import { LoginDto } from 'src/common/dto';
// import { ApiResponse } from 'src/common/api-response/api-response.utils';
// import { throwError } from 'rxjs';

// @Controller('users/auth')
// export class AuthController {
//   private readonly logger = new Logger(AuthController.name);

//   constructor(private readonly authService: AuthService) {}

//   @Post('login')
//   async login(
//     @Body() loginDto: LoginDto,
//     @Res({ passthrough: true }) res: Response,
//   ) {
//     this.logger.log(`login called for email: ${loginDto.email}`);

//     try {
//       this.logger.debug(`Validating user credentials for: ${loginDto.email}`);
//       const user = await this.authService.validateUser(
//         loginDto.email,
//         loginDto.password,
//       );

//       this.logger.debug(`Generating tokens for user: ${user.id}`);
//       const { accessToken, refreshToken } =
//         await this.authService.generateTokens(user);

//       // Set refresh token as secure cookie
//       res.cookie('refresh_token', refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production', // only HTTPS in prod
//         sameSite: 'strict',
//         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//       });

//       this.logger.log(`Login successful for user: ${user.id}`);
//       const result = {
//         accessToken,
//         user: {
//           id: user.id,
//           email: user.email,
//           name: user.name,
//         },
//       };

//       return new ApiResponse(result, 'Login successful', HttpStatus.OK);
//     } catch (error) {
//       throwServiceError(error, this.logger, 'Auth -> Login');
//     }
//   }

//   @Post('refresh')
//   async refresh(@Req() req: Request) {
//     this.logger.log('refresh called');

//     try {
//       const refreshToken = req.cookies?.['refresh_token'];

//       console.log('Refresh token from cookies:', refreshToken);

//       if (!refreshToken) {
//         this.logger.warn('No refresh token found in cookies');
//         throw new NotFoundException('No refresh token found in cookies');
//       }

//       this.logger.debug('Processing refresh token');
//       const result = await this.authService.refreshToken(refreshToken);

//       this.logger.log('Token refresh successful');
//       return new ApiResponse(result, 'Token refreshed', HttpStatus.OK);
//     } catch (error) {
//       throw error;
//     }
//   }

//   @Post('logout')
//   async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
//     this.logger.log('logout called');

//     try {
//       const refreshToken = req.cookies?.['refresh_token'];

//       if (refreshToken) {
//         this.logger.debug('Invalidating refresh token');
//         await this.authService.logout(refreshToken);
//       } else {
//         this.logger.warn('No refresh token found for logout');
//       }

//       // Clear the cookie regardless
//       res.clearCookie('refresh_token');

//       this.logger.log('Logout successful');
//       return new ApiResponse(
//         { message: 'Logged out successfully' },
//         'Logged out successfully',
//         HttpStatus.OK,
//       );
//     } catch (error) {
//       throw error;
//     }
//   }
// }
