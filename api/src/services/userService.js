const fs = require('fs');
const prisma = require('../utils/prisma');
const { toRelativeMediaPath } = require('../utils/url');
const { resolveSafeDiskPath } = require('./uploadOrphanService');

async function deleteUserAvatar(avatar) {
  const avatarPath = toRelativeMediaPath(avatar);
  if (!avatarPath) return;

  const resolved = resolveSafeDiskPath(avatarPath);
  if (!resolved) return;

  try {
    await fs.promises.unlink(resolved.diskPath);
  } catch {
    // DB already deleted; ignore file cleanup failures
  }
}

async function deleteUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, avatar: true },
  });

  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  await deleteUserAvatar(user.avatar);
}

module.exports = {
  deleteUser,
};
