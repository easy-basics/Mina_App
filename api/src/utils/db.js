const prisma = require('./prisma');

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    return err;
  }
}

function isPrismaConnectionError(err) {
  const code = err?.code || err?.errorCode;
  const message = err?.message || '';
  return (
    code === 'P1000' ||
    code === 'P1001' ||
    err?.name === 'PrismaClientInitializationError' ||
    message.includes('Authentication failed') ||
    message.includes("Can't reach database server")
  );
}

function getConnectionErrorMessage() {
  return '数据库连接失败，请检查 api/.env 中的 DATABASE_URL（MySQL 用户名、密码、库名是否正确），并确认已执行 prisma migrate 与 seed';
}

module.exports = {
  checkDatabaseConnection,
  isPrismaConnectionError,
  getConnectionErrorMessage,
};
