const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  const initializeSentry = () => {
    void import("@sentry/nextjs")
      .then(({ init }) => {
        init({
          dsn,
          tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0,
          environment: process.env.NODE_ENV,
        });
      })
      .catch((error: unknown) => console.error("Could not initialize frontend error monitoring.", error));
  };

  const scheduleInitialization = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(initializeSentry, { timeout: 5_000 });
    } else {
      window.setTimeout(initializeSentry, 2_500);
    }
  };
  if (document.readyState === "complete") scheduleInitialization();
  else window.addEventListener("load", scheduleInitialization, { once: true });
}
