/**
 * 解析 CORS_ORIGIN：逗号分隔多个来源，如
 * http://localhost:5173,https://admin.mina.bigdeng.com
 */
function parseAllowedOrigins() {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCorsOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = parseAllowedOrigins();

  return {
    origin(origin, callback) {
      // 非浏览器 / 同源无 Origin
      if (!origin) {
        return callback(null, true);
      }

      // 开发环境放行（admin 直连 localhost:3000、5173 等）
      if (!isProd) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] blocked origin: ${origin}, allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

module.exports = { getCorsOptions, parseAllowedOrigins };
