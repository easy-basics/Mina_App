const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const { code2Session, getPhoneNumber } = require('../../services/wechatService');
const { toRelativeMediaPath } = require('../../utils/url');
const miniUserMiddleware = require('../../middleware/miniUser');

const router = express.Router();

router.post('/wechat', async (req, res, next) => {
  try {
    const { code, nickname, avatar } = req.body;
    if (!code) {
      return fail(res, '缺少登录 code');
    }

    const session = await code2Session(code);
    // 静默登录仅传 code；头像昵称通过 PUT /profile 更新
    const profileData = {};
    if (nickname !== undefined) {
      const name = nickname?.trim();
      profileData.nickname = name || null;
    }
    if (avatar !== undefined) {
      const url = avatar?.trim();
      profileData.avatar = url ? toRelativeMediaPath(url) : null;
    }

    const user = await prisma.user.upsert({
      where: { openid: session.openid },
      update: {
        unionid: session.unionid || undefined,
        ...profileData,
      },
      create: {
        openid: session.openid,
        unionid: session.unionid || null,
        nickname: profileData.nickname ?? null,
        avatar: profileData.avatar ?? null,
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
      user: formatUser(user),
    });
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

const userSelect = {
  id: true,
  nickname: true,
  avatar: true,
  phone: true,
  realName: true,
  companyName: true,
  companyAddress: true,
};

function formatUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    phone: user.phone,
    realName: user.realName,
    companyName: user.companyName,
    companyAddress: user.companyAddress,
  };
}

router.get('/me', miniUserMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelect,
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
    const { nickname, avatar, phone, realName, companyName, companyAddress } = req.body;
    const data = {};

    if (nickname !== undefined) data.nickname = nickname?.trim() || null;
    if (avatar !== undefined) {
      const url = avatar?.trim();
      data.avatar = url ? toRelativeMediaPath(url) : null;
    }
    if (phone !== undefined) {
      const p = phone?.trim();
      if (p && !/^1\d{10}$/.test(p)) {
        return fail(res, '手机号格式不正确');
      }
      data.phone = p || null;
    }
    if (realName !== undefined) {
      const name = realName?.trim();
      if (name !== null && name !== '' && name.length > 32) {
        return fail(res, '姓名不能超过32字');
      }
      data.realName = name || null;
    }
    if (companyName !== undefined) {
      const company = companyName?.trim();
      if (company !== null && company !== '' && company.length > 128) {
        return fail(res, '公司名不能超过128字');
      }
      data.companyName = company || null;
    }
    if (companyAddress !== undefined) {
      const addr = companyAddress?.trim();
      if (addr !== null && addr !== '' && addr.length > 255) {
        return fail(res, '公司地址不能超过255字');
      }
      data.companyAddress = addr || null;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        phone: true,
        realName: true,
        companyName: true,
        companyAddress: true,
      },
    });
    return success(res, user, '更新成功');
  } catch (err) {
    return next(err);
  }
});

router.post('/phone', miniUserMiddleware, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return fail(res, '缺少手机号授权 code');
    }

    const phoneInfo = await getPhoneNumber(code);
    const phone = phoneInfo.phoneNumber || phoneInfo.purePhoneNumber;
    if (!phone) {
      return fail(res, '获取手机号失败');
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { phone },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        phone: true,
        realName: true,
        companyName: true,
        companyAddress: true,
      },
    });
    return success(res, { phone, user }, '绑定成功');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

module.exports = router;
