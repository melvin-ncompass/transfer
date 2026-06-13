// import { Module } from '@nestjs/common';
// // import { GoogleStrategy } from './strategies/google.strategy';
// import { GithubStrategy } from './utils/github/github.strategy';
// import { AuthController } from './auth.controller';
// import { PassportModule } from '@nestjs/passport';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from 'src/entities/user.entity';
// import { AuthService } from './auth.service';
// import { JwtModule } from '@nestjs/jwt';
// import { JwtStrategy } from './utils/jwt/jwt.strategy';
// import { RefreshToken } from 'src/entities/refresh-token.entity';
// import { GithubToken } from 'src/entities/github-token.entity';
// import { ConfigModule, ConfigService } from '@nestjs/config';

// @Module({
//   imports: [
//     ConfigModule.forRoot(), // Load .env
//     TypeOrmModule.forFeature([User, RefreshToken, GithubToken]),
//     PassportModule.register({ session: true }),
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>('JWT_SECRET'),
//         signOptions: { expiresIn: '15m' },
//       }),
//     }),
//   ],
//   controllers: [AuthController],
//   providers: [AuthService, GithubStrategy, JwtStrategy],
// })
// export class AuthModule {}
