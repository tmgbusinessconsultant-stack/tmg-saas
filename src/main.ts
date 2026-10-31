import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  (BigInt.prototype as any).toJSON = function () { return Number(this); };

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // === STEP 4: Serve uploaded logos ===
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  configureApp(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With',
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Production Stack Engine Active on http://localhost:${port}/api`);
  logger.log(`📁 Uploads served at http://localhost:${port}/uploads`);
}

void bootstrap();
