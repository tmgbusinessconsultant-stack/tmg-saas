export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const serverDsn = process.env.SENTRY_DSN?.trim();
    if (serverDsn) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({
        dsn: serverDsn,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
        environment: process.env.NODE_ENV,
      });
    }
  }
}
