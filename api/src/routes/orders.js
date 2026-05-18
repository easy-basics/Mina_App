const express = require('express');
const prisma = require('../utils/prisma');
const { success, fail } = require('../utils/response');
const { getStatusesForType } = require('../constants/orders');

const router = express.Router();

function serializeOrder(order) {
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    items: order.items?.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const { orderType, status, storeId, keyword } = req.query;

    const where = {
      ...(orderType ? { orderType } : {}),
      ...(status ? { status } : {}),
      ...(storeId ? { storeId: parseInt(storeId, 10) } : {}),
      ...(keyword
        ? {
            OR: [
              { orderNo: { contains: keyword } },
              { customerName: { contains: keyword } },
              { customerPhone: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          store: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return success(res, {
      list: list.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) })),
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
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        store: true,
        items: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          include: { admin: { select: { id: true, username: true } } },
        },
      },
    });
    if (!order) {
      return fail(res, '订单不存在', 404, 404);
    }
    return success(res, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!status) {
      return fail(res, '状态不能为空');
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return fail(res, '订单不存在', 404, 404);
    }

    const allowed = getStatusesForType(order.orderType);
    if (!allowed.includes(status)) {
      return fail(res, '无效的订单状态');
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

    await prisma.orderLog.create({
      data: {
        orderId: id,
        adminId: req.admin.id,
        content: `状态变更为：${status}`,
      },
    });

    return success(res, { ...updated, totalAmount: Number(updated.totalAmount) }, '状态已更新');
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/logs', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { content } = req.body;
    if (!content?.trim()) {
      return fail(res, '备注内容不能为空');
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return fail(res, '订单不存在', 404, 404);
    }

    const log = await prisma.orderLog.create({
      data: {
        orderId,
        adminId: req.admin.id,
        content: content.trim(),
      },
      include: { admin: { select: { id: true, username: true } } },
    });

    return success(res, log, '备注已添加');
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
