const express = require('express');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const { toAbsoluteUrl } = require('../../utils/url');
const miniUserMiddleware = require('../../middleware/miniUser');

const router = express.Router();
router.use(miniUserMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });
    const list = favorites
      .filter((f) => f.product?.enabled)
      .map((f) => ({
        productId: f.productId,
        id: f.product.id,
        code: f.product.code,
        name: f.product.name,
        coverImage: toAbsoluteUrl(f.product.coverImage),
        category: f.product.category,
      }));
    return success(res, list);
  } catch (err) {
    return next(err);
  }
});

router.post('/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const product = await prisma.product.findFirst({
      where: { id: productId, enabled: true },
    });
    if (!product) {
      return fail(res, '商品不存在', 404, 404);
    }
    await prisma.favorite.upsert({
      where: {
        userId_productId: { userId: req.user.id, productId },
      },
      update: {},
      create: { userId: req.user.id, productId },
    });
    return success(res, { favorited: true }, '已收藏');
  } catch (err) {
    return next(err);
  }
});

router.delete('/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    await prisma.favorite.deleteMany({
      where: { userId: req.user.id, productId },
    });
    return success(res, { favorited: false }, '已取消收藏');
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
