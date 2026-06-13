import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL') || '/auth/github/callback';

    console.log('GitHub OAuth Config:', { 
      clientID: clientID ? '[SET]' : '[NOT SET]', 
      clientSecret: clientSecret ? '[SET]' : '[NOT SET]',
      callbackURL 
    });

    if (!clientID || !clientSecret) {
      throw new Error(`Missing GitHub OAuth configuration: clientID=${clientID ? '[SET]' : '[NOT SET]'}, clientSecret=${clientSecret ? '[SET]' : '[NOT SET]'}`);
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['read:user', 'user:email', 'repo'],
    });
  }

  validate(
    accessToken: string,
    _: string,
    profile: { id: string; username: string; emails: { value: string }[] },
  ) {
    return {
      githubId: profile.id,
      githubUsername: profile.username,
      email: profile.emails?.[0]?.value,
      githubAccessToken: accessToken,
    };
  }
}
