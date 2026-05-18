const express = require('express');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const { toAbsoluteUrl } = require('../../utils/url');
const router = express.Router();

function mapProductListItem(p) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    coverImage: toAbsoluteUrl(p.coverImage),
    categoryId: p.categoryId,
    category: p.category,
  };
}

function mapSku(s) {
  return { ...s, price: Number(s.price) };
}

router.get('/categories', async (req, res, next) => {
  try {
    const list = await prisma.category.findMany({
      where: { parentId: null, enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return success(res, list);
  } catch (err) {
    return next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId, 10) : undefined;
    const keyword = req.query.keyword?.trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));

    const where = {
      enabled: true,
      ...(categoryId ? { categoryId } : {}),
      ...(keyword
        ? { OR: [{ name: { contains: keyword } }, { code: { contains: keyword } }] }
        : {}),
    };

    const [list, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    return success(res, {
      list: list.map(mapProductListItem),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await prisma.product.findFirst({
      where: { id, enabled: true },
      include: {
        category: { select: { id: true, name: true } },
        skus: {
          where: { enabled: true },
          orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        },
        detailImages: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
        params: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
        productStores: {
          include: { store: { select: { id: true, name: true, address: true, phone: true } } },
        },
      },
    });

    if (!product) {
      return fail(res, '商品不存在或已下架', 404, 404);
    }

    let favorited = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(
          authHeader.slice(7),
          process.env.JWT_USER_SECRET || process.env.JWT_SECRET
        );
        if (payload.role === 'user') {
          const fav = await prisma.favorite.findUnique({
            where: {
              userId_productId: { userId: payload.sub, productId: id },
            },
          });
          favorited = !!fav;
        }
      } catch {
        // ignore
      }
    }

    const skus = product.skus.map(mapSku);
    const minPrice = skus.length ? Math.min(...skus.map((s) => s.price)) : null;

    return success(res, {
      id: product.id,
      code: product.code,
      name: product.name,
      coverImage: toAbsoluteUrl(product.coverImage),
      category: product.category,
      detailImages: product.detailImages.map((img) => ({
        ...img,
        url: toAbsoluteUrl(img.url),
      })),
      params: product.params,
      skus,
      minPrice,
      stores: product.productStores
        .map((ps) => ps.store)
        .filter((s) => s),
      favorited,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/stores', async (req, res, next) => {
  try {
    const productId = req.query.productId ? parseInt(req.query.productId, 10) : null;
    if (productId) {
      const links = await prisma.productStore.findMany({
        where: { productId },
        include: { store: true },
      });
      return success(
        res,
        links.map((l) => l.store).filter((s) => s.enabled)
      );
    }
    const list = await prisma.store.findMany({
      where: { enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return success(res, list);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
