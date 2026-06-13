// import {
//   Get,
//   Injectable,
//   Post,
//   Query,
//   UnauthorizedException,
//   UseGuards,
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { InjectRepository } from '@nestjs/typeorm';
// import { GithubToken } from 'src/entities/github-token.entity';
// import { RefreshToken } from 'src/entities/refresh-token.entity';
// import { User } from 'src/entities/user.entity';
// import { Repository } from 'typeorm';

// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//     @InjectRepository(RefreshToken)
//     private readonly refreshTokenRepository: Repository<RefreshToken>,
//     @InjectRepository(GithubToken)
//     private readonly githubTokenRepository: Repository<GithubToken>,
//     private readonly jwtService: JwtService,
//   ) {}

//   async issueToken(req) {
//     const { githubId, githubUsername, email, githubAccessToken } = req.user;
//     const deviceId = req.headers['x-device-id'];
//     const userAgent = req.headers['user-agent'];
//     const ipAddress = req.ip;

//     let user = await this.userRepository.findOne({
//       where: { username: githubUsername, email },
//     });

//     if (!user) {
//       user = this.userRepository.create({
//         username: githubUsername,
//         email,
//         role: 'user',
//       });
//       await this.userRepository.save(user);
//     }

//     const githubToken = this.githubTokenRepository.create({
//       githubUserId: githubId,
//       githubUserName: githubUsername,
//       githubAccessToken,
//       user,
//       issuedAt: new Date(),
//       deviceId,
//       userAgent,
//       ipAddress,
//     });
//     await this.githubTokenRepository.save(githubToken);

//     const payload = { sub: user.id, username: user.username };
//     const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
//     const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

//     const tokenEntity = this.refreshTokenRepository.create({
//       refreshToken,
//       user,
//       issuedAt: new Date(),
//       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//       deviceId,
//       userAgent,
//       ipAddress,
//     });
//     await this.refreshTokenRepository.save(tokenEntity);

//     return { accessToken };
//   }

//   async refreshToken(token: string, req) {
//     const deviceId = req.headers['x-device-id'];

//     const storedToken = await this.refreshTokenRepository.findOne({
//       where: { refreshToken: token, deviceId, isActive: true },
//       relations: ['user'],
//     });

//     if (!storedToken || storedToken.expiresAt < new Date()) {
//       throw new UnauthorizedException('Invalid or expired refresh token');
//     }

//     const newAccessToken = this.jwtService.sign(
//       { sub: storedToken.user.id, username: storedToken.user.username },
//       { expiresIn: '15m' },
//     );

//     return { accessToken: newAccessToken };
//   }

//   async logout(token: string, req) {
//     const deviceId = req.headers['x-device-id'];

//     const storedToken = await this.refreshTokenRepository.findOne({
//       where: { refreshToken: token, deviceId },
//     });

//     if (storedToken) {
//       storedToken.isActive = false;
//       await this.refreshTokenRepository.save(storedToken);
//     }

//     return { success: true };
//   }

//   async logoutAll(userId: number) {
//     await this.refreshTokenRepository.update(
//       { user: { id: userId }, isActive: true },
//       { isActive: false },
//     );

//     await this.githubTokenRepository.update(
//       { user: { id: userId }, isActive: true },
//       { isActive: false },
//     );

//     return { success: true };
//   }
// }
