import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.init(); // Core change: initialize instead of app.listen()

  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp;
}

// Export a handler for Vercel to look for
export default async (req: any, res: any) => {
  const server = await bootstrap();
  return server(req, res);
};
