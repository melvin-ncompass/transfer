import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
// import { BASE_URL } from '@/shared';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @UseGuards(AuthGuard('github'))
  @Get('github/login')
  githubLoginUrl() {
    const clientID = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;
    const scope = ['read:user', 'user:email', 'repo'].join(' ');
    const url = `https://github.com/login/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectUri}&scope=${scope}`;
    // console.log('GitHub OAuth URL:', url);
    return { gitHub_OAuth_URL: url };
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res) {
    const tokens = await this.authService.issueToken(req);
    // return res.json({...tokens, redirectTo: '/dashboard'});
    res.redirect(
      `http://localhost:5173/dashboard?token=${tokens.githubAccessToken}`,
    );
  }

  // @Post('refresh')
  // async refresh(@Body('refreshToken') token: string) {
  //   const tokens = await this.authService.refreshToken(token);
  //   return tokens;
  // }

  // @Post('logout')
  // async logout(@Body('refreshToken') token: string) {
  //   const result = await this.authService.logout(token);
  //   return result;
  // }
}
