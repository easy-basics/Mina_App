const { fail } = require('../utils/response');
const { isPrismaConnectionError, getConnectionErrorMessage } = require('../utils/db');

function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }

  if (isPrismaConnectionError(err)) {
    return fail(res, getConnectionErrorMessage(), 503, 503);
  }

  const status = err.status || 500;
  let message = err.message || '服务器错误';

  // 避免把 Prisma 长堆栈直接返回给前端
  if (message.includes('prisma.') && message.includes('invocation')) {
    message = '服务器内部错误，请查看 API 日志';
  }

  return fail(res, message, status, status);
}

module.exports = errorHandler;
