// import {
//   Body,
//   Controller,
//   Get,
//   Post,
//   Req,
//   Res,
//   UseGuards,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { AuthService } from './auth.service';

// @Controller('auth')
// export class AuthController {
//   constructor(
//     private readonly authService: AuthService,
//   ) {}

//   @UseGuards(AuthGuard('github'))
//   @Get('github/login')
//   async githubLogin() {
//     // This route will redirect to GitHub's OAuth page
//   }

//   @Get('github/callback')
//   @UseGuards(AuthGuard('github'))
//   async githubCallback(@Req() req, @Res() res) {
//     const tokens = await this.authService.issueToken(req);
//     return res.json(tokens);
//   }

//   @Post('refresh')
//   async refresh(@Body('refreshToken') token: string, @Req() req, @Res() res) {
//     const tokens = await this.authService.refreshToken(token , req);
//     return res.json(tokens);
//   }

//   @Post('logout')
//   async logout(@Body('refreshToken') token: string, @Req() req, @Res() res) {
//     const result = await this.authService.logout(token, req);
//     return res.json(result);
//   }
// }
