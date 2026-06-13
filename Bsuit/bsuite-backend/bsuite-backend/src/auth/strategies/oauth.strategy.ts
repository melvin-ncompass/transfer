import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { AuthService } from '../auth.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class OAuthStrategy extends PassportStrategy(Strategy, 'oauth') {
    private oauth2Client: OAuth2Client;

    constructor(private readonly authService: AuthService) {
        super({
            authorizationURL: process.env.GOOGLE_AUTHORIZATION_URL,
            tokenURL: process.env.GOOGLE_TOKEN_URL,
            clientID: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
        });
        this.oauth2Client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);
    }

    async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
        const userProfile = await this.getGoogleProfile(accessToken);
        if (!userProfile) {
            throw new UnauthorizedException('Google user profile data is missing');
        }
        const user = await this.authService.validateOAuth(userProfile);
        return user;
    }

    private async getGoogleProfile(accessToken: string): Promise<any> {
        this.oauth2Client.setCredentials({ access_token: accessToken });

        const res = await this.oauth2Client.request({
            url: process.env.GOOGLE_PROIFLE_URL,
        });
        return res.data;
    }
}