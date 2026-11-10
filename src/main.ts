import './common/sentry';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import type { Request, Response } from 'express';
import { join } from 'path';
import * as express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { resolvePayPalMode } from './paypal/paypal-config';
import { createPayPalWebhookRateLimit } from './paypal/paypal-webhook-rate-limit';
import { seedAdmin } from './seed-admin';

async function bootstrap() {
  resolvePayPalMode();
  (BigInt.prototype as any).toJSON = function () { return Number(this); };

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { statusCode: 429, message: 'Too many requests. Please try again later.' },
    }),
  );

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const authLoginRateLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { statusCode: 429, message: 'Too many login attempts. Please try again later.' },
  });
  const authRegisterRateLimit = rateLimit({
    windowMs: 60 * 60_000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { statusCode: 429, message: 'Too many registration attempts. Please try again later.' },
  });
  app.use('/api/auth/login', authLoginRateLimit);
  app.use('/api/auth/register', authRegisterRateLimit);

  app.use('/uploads/projects', (_req: Request, res: Response) => res.sendStatus(404));
  const paypalWebhookRateLimit = createPayPalWebhookRateLimit();
  app.use('/api/paypal/webhook', paypalWebhookRateLimit);
  app.use('/api/payments/webhook/paypal', paypalWebhookRateLimit);

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  configureApp(app);
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  await seedAdmin();

  logger.log(`ðŸš€ Production Stack Engine Active on http://localhost:${port}/api`);
  logger.log(`ðŸ“ Uploads served at http://localhost:${port}/uploads`);
}

void bootstrap();
