import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './core/all-exceptions.filter';
import { ConfigService } from './config/config.service';
import { ApiKeyGuard } from './auth/api-key.guard';
import { NextFunction, Request, Response } from 'express';

export async function bootstrap(portOverride?: number) {
  const app = await NestFactory.create(AppModule);

  // Enable explicit CORS for future React Frontend connections
  app.enableCors();

  // Enforce DTO validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enforce structured error JSON payloads
  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(ConfigService);
  app.useGlobalGuards(new ApiKeyGuard(configService));
  const configuredApiKey = configService.getConfig()?.apiKey?.trim();

  // Auto-provision API key cookie for the local UI so users do not need to paste it manually.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!configuredApiKey || req.path.startsWith('/api')) {
      return next();
    }

    res.cookie('melcp_api_key', configuredApiKey, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      path: '/api',
    });
    return next();
  });

  const configuredHost = configService.getConfig()?.host?.trim();
  const resolvedHost = configuredHost || process.env.HOST || '127.0.0.1';
  const resolvedPort = portOverride ?? Number(process.env.PORT ?? 3001);

  if (resolvedHost !== '127.0.0.1' && resolvedHost !== 'localhost') {
    // eslint-disable-next-line no-console
    console.warn(
      `WARNING: Binding to ${resolvedHost} exposes this tool to the network. Make sure this is intentional.`,
    );
  }

  await app.listen(resolvedPort, resolvedHost);

  return app;
}

if (require.main === module) {
  void bootstrap();
}
