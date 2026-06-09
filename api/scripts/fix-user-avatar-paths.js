/**
 * 将 users.avatar 中的绝对 URL 规范为 /uploads/... 相对路径
 * 用法：cd api && node scripts/fix-user-avatar-paths.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const prisma = require('../src/utils/prisma');
const { toRelativeMediaPath } = require('../src/utils/url');

async function main() {
  const users = await prisma.user.findMany({
    where: { avatar: { not: null } },
    select: { id: true, avatar: true },
  });

  let updated = 0;
  for (const user of users) {
    const next = toRelativeMediaPath(user.avatar);
    if (next === user.avatar) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: next },
    });
    console.log(`#${user.id}: ${user.avatar} -> ${next}`);
    updated += 1;
  }

  console.log(`Done. ${updated}/${users.length} avatar(s) updated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
