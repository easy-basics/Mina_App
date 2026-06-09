const express = require('express');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const miniUserMiddleware = require('../../middleware/miniUser');
const { createJsapiPayParams } = require('../../services/wechatService');
const {
  isRealPayEnabled,
  handlePaymentNotify,
  queryPaymentByOrderNo,
} = require('../../services/wechatPayService');
const { ORDER_TYPES } = require('../../constants/orders');

const router = express.Router();

async function markOrderPaid(orderNo, transactionId) {
  await prisma.order.updateMany({
    where: { orderNo, payStatus: 'unpaid' },
    data: {
      payStatus: 'paid',
      status: 'paid',
      wxTransactionId: transactionId || undefined,
    },
  });
}

// 微信支付回调（无需 JWT）须在动态路由之前
router.post('/notify', express.raw({ type: '*/*' }), async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      const orderNo = req.query.orderNo;
      if (orderNo) {
        await markOrderPaid(orderNo);
      }
      return res.status(200).json({ code: 'SUCCESS', message: '成功' });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    const result = await handlePaymentNotify(req.headers, rawBody);
    await markOrderPaid(result.outTradeNo, result.transactionId);
    return res.status(200).json({ code: 'SUCCESS', message: '成功' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ code: 'FAIL', message: err.message });
    }
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

    const openid = req.user.openid;
    if (isRealPayEnabled() && !openid) {
      return fail(res, '请重新微信登录', 400, 400);
    }

    const payment = await createJsapiPayParams(order, openid, req.ip);
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

router.post('/sync/:orderId', async (req, res, next) => {
  try {
    if (!isRealPayEnabled()) {
      return fail(res, '仅生产环境可用', 403, 403);
    }

    const orderId = parseInt(req.params.orderId, 10);
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id },
    });
    if (!order) {
      return fail(res, '订单不存在', 404, 404);
    }
    if (order.payStatus === 'paid') {
      return success(res, { paid: true, orderId: order.id });
    }

    const wxOrder = await queryPaymentByOrderNo(order.orderNo);
    if (wxOrder.trade_state === 'SUCCESS') {
      await markOrderPaid(order.orderNo, wxOrder.transaction_id);
      return success(res, { paid: true, orderId: order.id });
    }

    return success(res, {
      paid: false,
      orderId: order.id,
      tradeState: wxOrder.trade_state,
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
