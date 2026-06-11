const express = require('express');
const prisma = require('../utils/prisma');
const { success, fail } = require('../utils/response');
const { toRelativeMediaPath } = require('../utils/url');

const router = express.Router();

const userListSelect = {
  id: true,
  openid: true,
  nickname: true,
  avatar: true,
  phone: true,
  realName: true,
  companyName: true,
  companyAddress: true,
  createdAt: true,
};

function serializeOrder(order) {
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
  };
}

function serializeUser(user) {
  return {
    ...user,
    avatar: toRelativeMediaPath(user.avatar),
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const keyword = req.query.keyword?.trim();

    const where = keyword
      ? {
          OR: [
            { openid: { contains: keyword } },
            { nickname: { contains: keyword } },
            { phone: { contains: keyword } },
            { realName: { contains: keyword } },
            { companyName: { contains: keyword } },
          ],
        }
      : {};

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...userListSelect,
          _count: { select: { orders: true } },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, {
      list: list.map(serializeUser),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userListSelect,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
        },
        orders: {
          orderBy: { id: 'desc' },
          take: 20,
        },
        _count: {
          select: { orders: true, addresses: true, favorites: true },
        },
      },
    });
    if (!user) {
      return fail(res, '用户不存在', 404, 404);
    }
    return success(res, {
      ...serializeUser(user),
      orders: user.orders.map(serializeOrder),
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
