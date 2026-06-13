/** 订单明细关联商品（详情页展示名称、主图） */
const ORDER_ITEM_WITH_PRODUCT = {
  include: {
    sku: {
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            coverImage: true,
          },
        },
      },
    },
  },
};

function mapOrderItem(item) {
  const product = item.sku?.product;
  return {
    id: item.id,
    orderId: item.orderId,
    skuId: item.skuId,
    specName: item.specName,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    productName: product?.name ?? null,
    productCode: product?.code ?? null,
    coverImage: product?.coverImage ?? null,
  };
}

function mapOrderItems(items) {
  if (!items?.length) return [];
  return items.map(mapOrderItem);
}

module.exports = {
  ORDER_ITEM_WITH_PRODUCT,
  mapOrderItem,
  mapOrderItems,
};
