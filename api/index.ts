import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
let cachedServer: any;
async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true });
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}
export default async (req: any, res: any) => {
  const server = await bootstrap();
  server(req, res);
};
