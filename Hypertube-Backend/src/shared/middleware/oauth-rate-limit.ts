import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

export const oauthRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many OAuth attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});