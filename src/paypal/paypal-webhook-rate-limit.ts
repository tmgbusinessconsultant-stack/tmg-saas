import { rateLimit } from 'express-rate-limit';

export function createPayPalWebhookRateLimit() {
  return rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { statusCode: 429, message: 'Too many PayPal webhook requests. Try again later.' },
  });
}
