const rateLimit = require('express-rate-limit');

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过于频繁，请稍后再试', data: null },
  handler(req, res) {
    res.status(429).json({ code: 429, message: '请求过于频繁，请稍后再试', data: null });
  },
});

module.exports = loginRateLimit;
