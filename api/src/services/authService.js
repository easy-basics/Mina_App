const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;
const JWT_EXPIRES_IN = '2h';
const GENERIC_ERROR = '用户名或密码错误';

function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
}

async function recordLoginAttempt(username, ip, success) {
  await prisma.loginAttempt.create({
    data: { username, ip, success },
  });
}

async function login(username, password, req) {
  const ip = getClientIp(req);
  const normalizedUsername = username?.trim();

  if (!normalizedUsername || !password) {
    await recordLoginAttempt(normalizedUsername || '', ip, false);
    const err = new Error(GENERIC_ERROR);
    err.status = 401;
    throw err;
  }

  const admin = await prisma.admin.findUnique({
    where: { username: normalizedUsername },
  });

  if (!admin) {
    await recordLoginAttempt(normalizedUsername, ip, false);
    const err = new Error(GENERIC_ERROR);
    err.status = 401;
    throw err;
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    await recordLoginAttempt(normalizedUsername, ip, false);
    const err = new Error('账号已锁定，请稍后再试');
    err.status = 423;
    throw err;
  }

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);

  if (!passwordOk) {
    const failedAttempts = admin.failedAttempts + 1;
    const updateData = { failedAttempts };
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await prisma.admin.update({
      where: { id: admin.id },
      data: updateData,
    });
    await recordLoginAttempt(normalizedUsername, ip, false);

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const err = new Error('账号已锁定，请 30 分钟后再试');
      err.status = 423;
      throw err;
    }

    const err = new Error(GENERIC_ERROR);
    err.status = 401;
    throw err;
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
  await recordLoginAttempt(normalizedUsername, ip, true);

  const token = jwt.sign(
    { sub: admin.id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    expiresIn: 7200,
    admin: {
      id: admin.id,
      username: admin.username,
      lastLoginAt: new Date(),
    },
  };
}

async function getMe(adminId) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      username: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!admin) {
    const err = new Error('管理员不存在');
    err.status = 404;
    throw err;
  }
  return admin;
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

module.exports = {
  login,
  getMe,
  hashPassword,
  GENERIC_ERROR,
};
