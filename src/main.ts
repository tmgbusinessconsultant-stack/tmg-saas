import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  (BigInt.prototype as any).toJSON = function () { return Number(this); };

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // FIX: Increase payload limit to 50mb - fixes request entity too large
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  configureApp(app);

  // 1. GLOBAL ENFORCEMENT ENGINE - Essential for SuperAppChatDto array checking
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strips away unmapped malicious fields automatically
      transform: true,          // Hydrates plain text payloads into structured DTO class objects
      forbidNonWhitelisted: false, // Set to true in strict mode to explicitly reject bad requests
    }),
  );

  // 2. STABILIZED CORS CONFIGURATION 
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
}

void bootstrap();