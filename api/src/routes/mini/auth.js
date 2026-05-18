const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const { code2Session } = require('../../services/wechatService');
const miniUserMiddleware = require('../../middleware/miniUser');

const router = express.Router();

router.post('/wechat', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return fail(res, '缺少登录 code');
    }

    const session = await code2Session(code);
    const user = await prisma.user.upsert({
      where: { openid: session.openid },
      update: {
        unionid: session.unionid || undefined,
      },
      create: {
        openid: session.openid,
        unionid: session.unionid || null,
      },
    });

    const token = jwt.sign(
      { sub: user.id, openid: user.openid, role: 'user' },
      process.env.JWT_USER_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return success(res, {
      token,
      expiresIn: 7 * 24 * 3600,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.get('/me', miniUserMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, nickname: true, avatar: true, phone: true, openid: true },
    });
    if (!user) {
      return fail(res, '用户不存在', 404, 404);
    }
    return success(res, user);
  } catch (err) {
    return next(err);
  }
});

router.put('/profile', miniUserMiddleware, async (req, res, next) => {
  try {
    const { nickname, avatar, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        nickname: nickname !== undefined ? nickname : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        phone: phone !== undefined ? phone : undefined,
      },
      select: { id: true, nickname: true, avatar: true, phone: true },
    });
    return success(res, user, '更新成功');
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
