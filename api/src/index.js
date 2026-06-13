require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = require('./app');
const prisma = require('./utils/prisma');
const { checkDatabaseConnection, getConnectionErrorMessage } = require('./utils/db');

const PORT = process.env.PORT || 3000;

async function start() {
  const dbCheck = await checkDatabaseConnection();
  if (dbCheck !== true) {
    console.error('\n[数据库] 连接失败');
    console.error(getConnectionErrorMessage());
    console.error('\n当前 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:([^:@/]+)@/, ':***@') || '(未设置)');
    console.error('\n请按 README 配置 MySQL 后执行:');
    console.error('  cd api && npm run db:setup\n');
    if (dbCheck?.message) {
      console.error('详情:', dbCheck.message.split('\n')[0]);
    }
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`API server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
