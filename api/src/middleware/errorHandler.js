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

  // 数据库 schema 与 Prisma Client 不一致（常见于未 migrate / 未 generate）
  const prismaMsg = err.message || '';
  if (
    err.code === 'P2022'
    || prismaMsg.includes('Unknown column')
    || prismaMsg.includes('does not exist in the current database')
    || (prismaMsg.includes('Unknown field') && prismaMsg.includes('User'))
    || prismaMsg.includes('Unknown arg')
    || (prismaMsg.includes('Unknown field') && prismaMsg.includes('showInHome'))
  ) {
    console.error('[schema] 请在服务器执行: npx prisma migrate deploy && npx prisma generate');
    return fail(res, '数据库未同步，请联系管理员执行 migrate deploy 与 prisma generate 后重启服务', 503, 503);
  }

  if (err.name === 'MulterError') {
    const multerMessages = {
      LIMIT_FILE_SIZE: '文件过大',
      LIMIT_FILE_COUNT: '上传文件数量超出限制',
      LIMIT_UNEXPECTED_FILE: '上传字段名错误，请使用 file',
    };
    return fail(res, multerMessages[err.code] || err.message, 400, 400);
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
