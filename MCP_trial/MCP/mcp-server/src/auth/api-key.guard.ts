import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '../config/config.service';

function readCookie(request: Request, name: string): string | undefined {
  const rawCookie = request.header('cookie');
  if (!rawCookie) {
    return undefined;
  }

  const cookieParts = rawCookie.split(';');
  for (const cookiePart of cookieParts) {
    const [rawKey, ...rawValueParts] = cookiePart.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValueParts.join('=')).trim();
    }
  }

  return undefined;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path ?? '';

    if (!path.startsWith('/api')) {
      return true;
    }

    const expectedApiKey = this.configService.getConfig()?.apiKey?.trim();
    const headerApiKey = request.header('x-api-key')?.trim();
    const cookieApiKey = readCookie(request, 'melcp_api_key');
    const queryApiKey =
      typeof request.query.apiKey === 'string' ? request.query.apiKey.trim() : undefined;

    if (
      expectedApiKey &&
      (headerApiKey === expectedApiKey ||
        cookieApiKey === expectedApiKey ||
        queryApiKey === expectedApiKey)
    ) {
      return true;
    }

    throw new HttpException(
      { error: 'Unauthorized', hint: 'Pass your API key via x-api-key header' },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
