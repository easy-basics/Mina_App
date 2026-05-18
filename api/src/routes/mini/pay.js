const express = require('express');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const miniUserMiddleware = require('../../middleware/miniUser');
const { createJsapiPayParams } = require('../../services/wechatService');
const { ORDER_TYPES } = require('../../constants/orders');

const router = express.Router();

// 微信支付回调（无需 JWT）须在动态路由之前
router.post('/notify', express.raw({ type: '*/*' }), async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      const orderNo = req.query.orderNo;
      if (orderNo) {
        await prisma.order.updateMany({
          where: { orderNo, payStatus: 'unpaid' },
          data: { payStatus: 'paid', status: 'paid' },
        });
      }
    }
    res.status(200).send({ code: 'SUCCESS', message: '成功' });
  } catch (err) {
    return next(err);
  }
});

router.use(miniUserMiddleware);

router.post('/wechat/:orderId', async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id },
    });
    if (!order) {
      return fail(res, '订单不存在', 404, 404);
    }
    if (order.orderType !== ORDER_TYPES.SAMPLE) {
      return fail(res, '仅布版订单支持在线支付');
    }
    if (order.payStatus === 'paid') {
      return fail(res, '订单已支付');
    }
    if (order.status === 'cancelled') {
      return fail(res, '订单已取消');
    }

    const payment = createJsapiPayParams(order);
    return success(res, {
      orderId: order.id,
      orderNo: order.orderNo,
      payment,
    });
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

// 开发环境模拟支付成功
router.post('/mock-success/:orderId', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return fail(res, '仅开发环境可用', 403, 403);
    }
    const orderId = parseInt(req.params.orderId, 10);
    const order = await prisma.order.update({
      where: { id: orderId, userId: req.user.id },
      data: { payStatus: 'paid', status: 'paid' },
    });
    return success(res, order, '模拟支付成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, '订单不存在', 404, 404);
    }
    return next(err);
  }
});

module.exports = router;
