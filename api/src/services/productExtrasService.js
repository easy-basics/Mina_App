const prisma = require('../utils/prisma');
const { DEFAULT_PRODUCT_PARAMS } = require('../constants/productDefaults');

async function initDefaultParams(productId) {
  const count = await prisma.productParam.count({ where: { productId } });
  if (count > 0) return;

  await prisma.productParam.createMany({
    data: DEFAULT_PRODUCT_PARAMS.map((item, index) => ({
      productId,
      name: item.name,
      value: item.value,
      sort: index,
    })),
  });
}

async function ensureProductExists(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const err = new Error('商品不存在');
    err.status = 404;
    throw err;
  }
  return product;
}

async function getNextHomeSort() {
  const result = await prisma.product.aggregate({
    where: { showInHome: true },
    _max: { homeSort: true },
  });
  return (result._max.homeSort ?? -1) + 1;
}

module.exports = {
  initDefaultParams,
  ensureProductExists,
  getNextHomeSort,
  DEFAULT_PRODUCT_PARAMS,
};
