import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysUser } from '../entity/sys_user.entity';
import { SysRefreshToken } from '../entity/sys_refresh_token.entity';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SysSession } from '../entity/sys_session.entity';
import { SysUserSession } from '../entity/sys_user_session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysUser,
      SysRefreshToken,
      SysSession,
      SysUserSession,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || 'supersecret';
        console.log('[AuthModule] JWT Secret:', secret);
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UserModule),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
