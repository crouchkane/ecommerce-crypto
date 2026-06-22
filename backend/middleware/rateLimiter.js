const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs = 15 * 60 * 1000, max = 100) =>
  rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

const authLimiter = createLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes
const apiLimiter = createLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

module.exports = { authLimiter, apiLimiter, createLimiter };
