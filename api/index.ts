import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

let cachedServer: Promise<ReturnType<typeof express>> | undefined;

function bootstrap() {
  if (!cachedServer) {
    const server = express();
    cachedServer = NestFactory.create(AppModule, new ExpressAdapter(server))
      .then((app) => {
        configureApp(app);
        return app.init().then(() => server);
      })
      .catch((error: unknown) => {
        cachedServer = undefined;
        throw error;
      });
  }
  return cachedServer;
}

export default async function handler(req: Request, res: Response) {
  const requestUrl = new URL(req.url ?? '/', 'http://localhost');
  const apiPath = requestUrl.searchParams.get('__vercel_path');
  if (apiPath !== null) {
    requestUrl.searchParams.delete('__vercel_path');
    req.url = `/api/${apiPath}${requestUrl.search}`;
  }

  const server = await bootstrap();
  return server(req, res);
}
