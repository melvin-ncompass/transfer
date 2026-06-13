import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth';
import * as passport from 'passport';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { AppLogger } from './utils/logger/logger';
import { safeImportModule } from './utils/module-loader';
import {
  customSwaggerCustomOptions,
  swaggerConfig,
} from './utils/swagger/swagger.config';
import { disableConsole } from './utils/logger/disableConsole';
import { SettingsService } from '../scaffolding/settings/settings.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(AppLogger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(cookieParser());
  app.use(passport.initialize());
  app.set('trust proxy', 1);

  const dataSource = app.get(DataSource);
  const configService = app.get(ConfigService);
  const settingsService = app.get(SettingsService);


  let branding = {
    fontColor: '#d33139',
    bgColor: '#f5f5f5',
    logo: null,
  };
  try {
    const brandingSettings = await settingsService.getConfig('branding');
    if (brandingSettings) {
      branding = {
        fontColor: brandingSettings?.fgcolor || branding.fontColor,
        bgColor: brandingSettings?.bgcolor || branding.bgColor,
        logo: brandingSettings?.logo || null,
      };
    }
  }
  catch (error) {
    console.warn(
      'Branding settings could not be loaded',
      error.message,
    );
  }
  const scaffoldModule = safeImportModule('scaffolding/scaffold.module');

  if (scaffoldModule) {
    try {
      const { BootstrapService } = await import(
        '../scaffolding/common/bootstrap/bootstrap.service'
      );
      const bootstrapService = app.get(BootstrapService);
      await bootstrapService.seed();
    } catch (error) {
      console.warn(
        'BootstrapService not available or failed to run seed:',
        error.message,
      );
    }

    try {
      const { SettingsService } = await import(
        '../scaffolding/settings/settings.service'
      );
      const settingsService = app.get(SettingsService);
      const storagePath = await settingsService.getSetting('storagePath');
      if (storagePath) {
        const pathParts = storagePath.split(/[\\\/]/);
        const lastPart = pathParts[pathParts.length - 1];
        app.useStaticAssets(storagePath, { prefix: `/${lastPart}/` });
        // console.log(
        //   `Serving static files from: ${storagePath} at /${lastPart}/`,
        // );
      } else {
        console.warn('No storage path configured in settings.');
      }
    } catch (error) {
      console.warn(
        'SettingsService not available or failed to load:',
        error.message,
      );
    }

    try {
      const { ActivityLoggerInterceptor } = await import(
        '../scaffolding/common/interceptor/activity-logger.interceptor'
      );
      app.useGlobalInterceptors(new ActivityLoggerInterceptor(dataSource));
    } catch (error) {
      console.warn(
        'ActivityLoggerInterceptor not available or failed to load:',
        error.message,
      );
    }
  } else {
    console.warn('Scaffold module not found. Skipping user-related services.');
  }

  const nodeEnv = configService.get<string>('NODE_ENV');
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',').map((o) => o.trim())
    : [];

  app.enableCors({
    origin: nodeEnv === 'production' ? allowedOrigins : true,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  app.use(
    ['/api'],
    basicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USERNAME]: process.env.SWAGGER_PASSWORD,
      },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const documentFactory = () =>
      SwaggerModule.createDocument(app, swaggerConfig);
    const customOptions = customSwaggerCustomOptions(branding);
    SwaggerModule.setup('api', app, documentFactory, customOptions);
    await app.listen(configService.get<number>('PORT') || 3000, '0.0.0.0');
  }

  console.log(`
 ██████╗██╗  ██╗██╗  ██╗    ██████╗ ██╗   ██╗██╗     ███████╗███████╗
██╔════╝╚██╗██╔╝██║  ██║    ██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██║      ╚███╔╝ ███████║    ██████╔╝██║   ██║██║     ███████╗█████╗  
██║      ██╔██╗ ██╔══██║    ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝  
╚██████╗██╔╝ ██╗██║  ██║    ██║     ╚██████╔╝███████╗███████║███████╗
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝                                                          
  `);

  disableConsole();
}
bootstrap();
