import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID')!,
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET')!,
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ||
        '/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, _: string, profile: any) {
    return {
      githubId: profile.id,
      githubUsername: profile.username,
      email: profile.emails?.[0]?.value,
      githubAccessToken: accessToken,
    };
  }
}
