/**
 * 测试 MySQL 连接，用法：
 *   node scripts/check-db.js
 *   MYSQL_PASSWORD=你的密码 node scripts/check-db.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('未设置 DATABASE_URL，请编辑 api/.env');
    process.exit(1);
  }

  const masked = url.replace(/:([^:@/]+)@/, ':***@');
  console.log('尝试连接:', masked);

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const adminCount = await prisma.admin.count();
    console.log('连接成功。管理员账号数:', adminCount);
    if (adminCount === 0) {
      console.log('提示: 尚未 seed，请执行 npm run prisma:seed');
    }
  } catch (err) {
    console.error('连接失败:', err.message.split('\n')[0]);
    console.error('\n请修改 api/.env 中的 DATABASE_URL，格式示例:');
    console.error('  DATABASE_URL="mysql://root:你的密码@localhost:3306/mina"');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
