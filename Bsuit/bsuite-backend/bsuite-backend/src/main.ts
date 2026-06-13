import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import passport from "passport";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import expressBasicAuth from "express-basic-auth";
import { setupSwagger } from "./swagger/swagger.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const clientUrl: string[] = [];
  const clientUrlEnv = configService.get<string>("CLIENT_URL");

  if (clientUrlEnv) {
    clientUrl.push(clientUrlEnv);
  }

  clientUrl.push("http://localhost:3000", "http://localhost:5000","http://localhost:5173");

  app.enableCors({
    origin: (origin, callback) => {
      const allowedDomainRegex = /\.bsuite-dev\.nclabs\.tech$/;

      if (
        !origin ||
        clientUrl.includes(origin) ||
        allowedDomainRegex.test(new URL(origin).hostname)
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"), false);
      }
    },
    credentials: true,
  });

  app.use(passport.initialize());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const swaggerUsername = process.env.SWAGGER_USERNAME;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (swaggerUsername && swaggerPassword) {
    app.use(
      ["/api"],
      expressBasicAuth({
        challenge: true,
        users: { [swaggerUsername]: swaggerPassword },
      })
    );
  }

  setupSwagger(app);

  // Default to port 3000 if PORT is not set in environment
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
