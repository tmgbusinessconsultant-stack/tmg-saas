import { ValidationPipe, type INestApplication } from '@nestjs/common';

export function configureApp(app: INestApplication): void {
  const trustedProxyHops = process.env.TRUST_PROXY_HOPS?.trim();
  if (trustedProxyHops) {
    const hops = Number(trustedProxyHops);
    if (!Number.isInteger(hops) || hops < 1 || hops > 5) {
      throw new Error('TRUST_PROXY_HOPS must be an integer from 1 to 5.');
    }
    app.getHttpAdapter().getInstance().set('trust proxy', hops);
  }

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: allowedOrigins.length > 0
      ? allowedOrigins
      : process.env.NODE_ENV === 'production'
        ? false
        : true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
}
