export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dsn = process.env.SENTRY_DSN?.trim();
    if (dsn) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({
        dsn,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
        environment: process.env.NODE_ENV,
      });
    }
  }
}
