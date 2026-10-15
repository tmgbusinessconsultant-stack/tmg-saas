import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
let cachedServer: any;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true });
  app.setGlobalPrefix('api');
  await app.init();
  return app.getHttpAdapter().getInstance();
}
async function startLocal() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  await app.listen(4000);
  console.log('TMG Running on http://localhost:4000/api');
}
if (!process.env.VERCEL) {
  startLocal();
}
export default async (req: any, res: any) => {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  cachedServer(req, res);
};
