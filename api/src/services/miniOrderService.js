const prisma = require('../utils/prisma');
const { generateOrderNo } = require('../utils/orderNo');
const { ORDER_TYPES } = require('../constants/orders');

async function resolveOrderItems(items) {
  const skuIds = items.map((i) => Number(i.skuId));
  const skus = await prisma.productSku.findMany({
    where: {
      id: { in: skuIds },
      enabled: true,
      product: { enabled: true },
    },
    include: { product: true },
  });
  const skuMap = new Map(skus.map((s) => [s.id, s]));

  const resolved = [];
  let totalAmount = 0;

  for (const item of items) {
    const sku = skuMap.get(Number(item.skuId));
    if (!sku) {
      const err = new Error(`规格 ${item.skuId} 不存在或已下架`);
      err.status = 400;
      throw err;
    }
    const qty = Number(item.quantity);
    if (qty <= 0) {
      const err = new Error('数量必须大于 0');
      err.status = 400;
      throw err;
    }
    const unitPrice = Number(sku.price);
    totalAmount += unitPrice * qty;
    resolved.push({
      skuId: sku.id,
      specName: sku.specName,
      quantity: qty,
      unitPrice,
      productId: sku.productId,
    });
  }

  return { resolved, totalAmount };
}

async function validateStoreForProducts(storeId, productIds) {
  const uniqueProductIds = [...new Set(productIds)];
  const links = await prisma.productStore.findMany({
    where: {
      storeId,
      productId: { in: uniqueProductIds },
    },
  });
  if (links.length !== uniqueProductIds.length) {
    const err = new Error('该门店不可售部分商品');
    err.status = 400;
    throw err;
  }
  const store = await prisma.store.findFirst({
    where: { id: storeId, enabled: true },
  });
  if (!store) {
    const err = new Error('门店不存在');
    err.status = 400;
    throw err;
  }
  return store;
}

async function createMiniOrder(userId, body) {
  const {
    orderType,
    storeId,
    items,
    deliveryType,
    addressId,
    remark,
    clearCartSkuIds,
  } = body;

  if (!orderType || !storeId || !items?.length) {
    const err = new Error('订单信息不完整');
    err.status = 400;
    throw err;
  }

  const { resolved, totalAmount } = await resolveOrderItems(items);
  const productIds = resolved.map((r) => r.productId);
  const store = await validateStoreForProducts(Number(storeId), productIds);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  let addressSnapshot = null;
  if (deliveryType === 'express') {
    if (!addressId) {
      const err = new Error('邮寄请选择收货地址');
      err.status = 400;
      throw err;
    }
    const addr = await prisma.userAddress.findFirst({
      where: { id: Number(addressId), userId },
    });
    if (!addr) {
      const err = new Error('收货地址不存在');
      err.status = 400;
      throw err;
    }
    addressSnapshot = JSON.stringify(addr);
  }

  const isSample = orderType === ORDER_TYPES.SAMPLE;
  const status = isSample ? 'pending_pay' : 'submitted';
  const payStatus = isSample ? 'unpaid' : 'offline';

  const order = await prisma.order.create({
    data: {
      orderNo: generateOrderNo(),
      orderType,
      storeId: store.id,
      userId,
      status,
      payStatus,
      totalAmount: isSample ? totalAmount : totalAmount,
      deliveryType: deliveryType || (isSample ? 'pickup' : null),
      addressSnapshot,
      remark: remark?.trim() || null,
      customerName: user?.nickname || null,
      customerPhone: user?.phone || null,
      items: {
        create: resolved.map((r) => ({
          skuId: r.skuId,
          specName: r.specName,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
        })),
      },
    },
    include: {
      store: true,
      items: true,
    },
  });

  if (clearCartSkuIds?.length) {
    await prisma.cartItem.deleteMany({
      where: {
        userId,
        skuId: { in: clearCartSkuIds.map(Number) },
        orderType,
      },
    });
  }

  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    items: order.items.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    })),
  };
}

module.exports = { createMiniOrder, resolveOrderItems };
