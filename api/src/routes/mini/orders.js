const express = require('express');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const miniUserMiddleware = require('../../middleware/miniUser');
const { createMiniOrder } = require('../../services/miniOrderService');
const {
  SAMPLE_STATUS_LABELS,
  BULK_STATUS_LABELS,
  PAY_STATUSES,
} = require('../../constants/orders');

const router = express.Router();
router.use(miniUserMiddleware);

function serializeOrder(order) {
  const statusLabels =
    order.orderType === 'bulk' ? BULK_STATUS_LABELS : SAMPLE_STATUS_LABELS;
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    statusLabel: statusLabels[order.status] || order.status,
    payStatusLabel:
      { unpaid: '未支付', paid: '已支付', offline: '线下支付' }[order.payStatus] ||
      order.payStatus,
    items: order.items?.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    })),
  };
}

router.get('/', async (req, res, next) => {
  try {
    const orderType = req.query.orderType;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));

    const where = {
      userId: req.user.id,
      ...(orderType ? { orderType } : {}),
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
      list: list.map((o) => ({
        ...serializeOrder(o),
        itemCount: o._count.items,
      })),
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
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: {
        store: true,
        items: true,
      },
    });
    if (!order) {
      return fail(res, '订单不存在', 404, 404);
    }
    let address = null;
    if (order.addressSnapshot) {
      try {
        address = JSON.parse(order.addressSnapshot);
      } catch {
        address = null;
      }
    }
    return success(res, { ...serializeOrder(order), address });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const order = await createMiniOrder(req.user.id, req.body);
    return success(res, order, '订单创建成功');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

module.exports = router;
