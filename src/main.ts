import './common/sentry';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import type { Request, Response } from 'express';
import { join } from 'path';
import * as express from 'express';
import { resolvePayPalMode } from './paypal/paypal-config';
import { createPayPalWebhookRateLimit } from './paypal/paypal-webhook-rate-limit';

async function bootstrap() {
  resolvePayPalMode();
  (BigInt.prototype as any).toJSON = function () { return Number(this); };

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.use('/uploads/projects', (_req: Request, res: Response) => res.sendStatus(404));
  const paypalWebhookRateLimit = createPayPalWebhookRateLimit();
  app.use('/api/paypal/webhook', paypalWebhookRateLimit);
  app.use('/api/payments/webhook/paypal', paypalWebhookRateLimit);

  // === STEP 4: Serve public uploaded assets ===
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

  logger.log(`ðŸš€ Production Stack Engine Active on http://localhost:${port}/api`);
  logger.log(`ðŸ“ Uploads served at http://localhost:${port}/uploads`);
}

void bootstrap();
