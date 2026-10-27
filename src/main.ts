import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  // FIX CORS - OVERRIDE WHATEVER configureApp DID
  app.enableCors({
    origin: true, // Allow all origins for dev - fixes Request failed
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With',
  });

  app.enableShutdownHooks();
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Backend running on http://localhost:${port}/api`);
}

void bootstrap();