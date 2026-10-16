import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// 1. Create a persistent express instance to route serverless traffic
const server = express();

export async function createServer() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.init(); // Bootstraps Nest modules cleanly without forcing a local port bind
  return server;
}

// 2. Keep local development running perfectly on port 3000
if (process.env.NODE_ENV !== 'production') {
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors();
    await app.listen(3000);
    console.log('Backend running locally on port 3000');
  }
  bootstrap();
}

// 3. Export the entry handler Vercel's lambda runtime is looking for
export default async (req: any, res: any) => {
  await createServer();
  return server(req, res);
};
