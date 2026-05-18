const express = require('express');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const { toAbsoluteUrl } = require('../../utils/url');
const miniUserMiddleware = require('../../middleware/miniUser');
const { ORDER_TYPES } = require('../../constants/orders');

const router = express.Router();
router.use(miniUserMiddleware);

async function getCartList(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      sku: {
        include: {
          product: {
            include: { category: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return items
    .filter((item) => item.sku?.enabled && item.sku?.product?.enabled)
    .map((item) => ({
      id: item.id,
      skuId: item.skuId,
      quantity: Number(item.quantity),
      orderType: item.orderType,
      specName: item.sku.specName,
      price: Number(item.sku.price),
      product: {
        id: item.sku.product.id,
        code: item.sku.product.code,
        name: item.sku.product.name,
        coverImage: toAbsoluteUrl(item.sku.product.coverImage),
      },
    }));
}

router.get('/', async (req, res, next) => {
  try {
    const list = await getCartList(req.user.id);
    return success(res, list);
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { skuId, quantity = 1, orderType = ORDER_TYPES.SAMPLE } = req.body;
    if (!skuId) {
      return fail(res, '请选择规格');
    }
    if (![ORDER_TYPES.SAMPLE, ORDER_TYPES.BULK].includes(orderType)) {
      return fail(res, '无效的订单类型');
    }

    const sku = await prisma.productSku.findFirst({
      where: { id: Number(skuId), enabled: true, product: { enabled: true } },
    });
    if (!sku) {
      return fail(res, '规格不存在', 404, 404);
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return fail(res, '数量必须大于 0');
    }

    await prisma.cartItem.upsert({
      where: {
        userId_skuId_orderType: {
          userId: req.user.id,
          skuId: Number(skuId),
          orderType,
        },
      },
      update: { quantity: qty },
      create: {
        userId: req.user.id,
        skuId: Number(skuId),
        quantity: qty,
        orderType,
      },
    });

    const list = await getCartList(req.user.id);
    return success(res, list, '已加入购物车');
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { quantity } = req.body;
    const item = await prisma.cartItem.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!item) {
      return fail(res, '购物车项不存在', 404, 404);
    }
    const qty = Number(quantity);
    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id } });
    } else {
      await prisma.cartItem.update({
        where: { id },
        data: { quantity: qty },
      });
    }
    const list = await getCartList(req.user.id);
    return success(res, list, '已更新');
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.cartItem.deleteMany({
      where: { id, userId: req.user.id },
    });
    const list = await getCartList(req.user.id);
    return success(res, list, '已删除');
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
