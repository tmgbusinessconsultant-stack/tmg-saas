import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://75870f4cd27dc2939a944298b6a7269b@o4512356911284224.ingest.us.sentry.io/4512356954800128",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
  enabled: true,
});
console.log("✅ Sentry monitoring enabled with NestJS SDK - Env:", process.env.NODE_ENV || 'development');
