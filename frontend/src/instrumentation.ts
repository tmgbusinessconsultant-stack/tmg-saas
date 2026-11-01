import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: "https://75870f4cd27dc2939a944298b6a7269b@o4512356911284224.ingest.us.sentry.io/4512356954800128",
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
      enabled: true,
    });
  }
}
