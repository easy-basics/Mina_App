const express = require('express');
const prisma = require('../utils/prisma');
const { success, fail } = require('../utils/response');
const {
  initDefaultParams,
  ensureProductExists,
  getNextHomeSort,
  DEFAULT_PRODUCT_PARAMS,
} = require('../services/productExtrasService');
const { applySortUpdates } = require('../utils/sortBatch');
const { getProductWxacode } = require('../services/wechatService');

const router = express.Router();

function serializeProduct(product) {
  return {
    ...product,
    price: product.price !== undefined ? Number(product.price) : undefined,
    skus: product.skus?.map((sku) => ({
      ...sku,
      price: Number(sku.price),
    })),
  };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId, 10) : undefined;
    const keyword = req.query.keyword?.trim();

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { code: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [list, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { skus: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return success(res, {
      list: list.map(serializeProduct),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/sort-list', async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId, 10) : undefined;
    if (!categoryId) {
      return fail(res, '请选择系列', 400, 400);
    }
    const list = await prisma.product.findMany({
      where: { categoryId },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { skus: true } },
      },
    });
    return success(res, list.map(serializeProduct));
  } catch (err) {
    return next(err);
  }
});

router.get('/home-sort-list', async (req, res, next) => {
  try {
    const list = await prisma.product.findMany({
      where: { showInHome: true },
      orderBy: [{ homeSort: 'asc' }, { id: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { skus: true } },
      },
    });
    return success(res, list.map(serializeProduct));
  } catch (err) {
    return next(err);
  }
});

router.put('/sort', async (req, res, next) => {
  try {
    const { items = [], categoryId } = req.body;
    const catId = categoryId ? Number(categoryId) : undefined;
    if (!catId) {
      return fail(res, '请选择系列', 400, 400);
    }
    await applySortUpdates('product', items, { categoryId: catId });
    return success(res, null, '排序已更新');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/home-sort', async (req, res, next) => {
  try {
    const { items = [] } = req.body;
    const parsed = await applySortUpdates('product', items, { showInHome: true }, 'homeSort');
    return success(res, parsed, '首页展示排序已更新');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        skus: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
        detailImages: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
        params: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!product) {
      return fail(res, '商品不存在', 404, 404);
    }
    const result = serializeProduct(product);
    if (!result.params?.length) {
      await initDefaultParams(id);
      result.params = await prisma.productParam.findMany({
        where: { productId: id },
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      });
    }
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/qrcode', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, code: true },
    });
    if (!product) {
      return fail(res, '商品不存在', 404, 404);
    }

    const { buffer, mock } = await getProductWxacode(id);
    return success(res, {
      qrcode: `data:image/png;base64,${buffer.toString('base64')}`,
      mock,
      product: { id: product.id, name: product.name, code: product.code },
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      categoryId,
      code,
      name,
      coverImage,
      enabled = true,
      sort = 0,
      showInHome = false,
      homeSort,
    } = req.body;
    if (!categoryId || !code?.trim() || !name?.trim()) {
      return fail(res, '系列、货号、名称不能为空');
    }
    const nextHomeSort = Boolean(showInHome) && homeSort === undefined
      ? await getNextHomeSort()
      : undefined;
    const product = await prisma.product.create({
      data: {
        categoryId: Number(categoryId),
        code: code.trim(),
        name: name.trim(),
        coverImage: coverImage || null,
        showInHome: Boolean(showInHome),
        homeSort: homeSort !== undefined
          ? Number(homeSort) || 0
          : nextHomeSort ?? 0,
        enabled: Boolean(enabled),
        sort: Number(sort) || 0,
      },
    });
    await initDefaultParams(product.id);
    return success(res, serializeProduct(product), '创建成功');
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { categoryId, code, name, coverImage, enabled, sort, showInHome, homeSort } = req.body;
    if (!code?.trim() || !name?.trim()) {
      return fail(res, '货号、名称不能为空');
    }
    const existing = await ensureProductExists(id);
    const shouldShowInHome = showInHome !== undefined ? Boolean(showInHome) : existing.showInHome;
    const nextHomeSort = shouldShowInHome && !existing.showInHome && homeSort === undefined
      ? await getNextHomeSort()
      : undefined;
    const product = await prisma.product.update({
      where: { id },
      data: {
        categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
        code: code.trim(),
        name: name.trim(),
        coverImage: coverImage !== undefined ? coverImage : undefined,
        showInHome: showInHome !== undefined ? Boolean(showInHome) : undefined,
        homeSort: homeSort !== undefined
          ? Number(homeSort) || 0
          : nextHomeSort,
        enabled: enabled !== undefined ? Boolean(enabled) : undefined,
        sort: sort !== undefined ? Number(sort) : undefined,
      },
    });
    return success(res, serializeProduct(product), '更新成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, '商品不存在', 404, 404);
    }
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.product.delete({ where: { id } });
    return success(res, null, '删除成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, '商品不存在', 404, 404);
    }
    return next(err);
  }
});

// SKU routes
router.get('/:id/skus', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const skus = await prisma.productSku.findMany({
      where: { productId },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return success(res, skus.map((s) => ({ ...s, price: Number(s.price) })));
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/skus', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const { specName, price, sort = 0, enabled = true } = req.body;
    if (!specName?.trim() || price === undefined || price === null) {
      return fail(res, '规格名称和价格不能为空');
    }
    const sku = await prisma.productSku.create({
      data: {
        productId,
        specName: specName.trim(),
        price: Number(price),
        sort: Number(sort) || 0,
        enabled: Boolean(enabled),
      },
    });
    return success(res, { ...sku, price: Number(sku.price) }, '创建成功');
  } catch (err) {
    return next(err);
  }
});

router.put('/:id/skus/sort', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await ensureProductExists(productId);
    const { items = [] } = req.body;
    await applySortUpdates('productSku', items, { productId });
    return success(res, null, '排序已更新');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/:productId/skus/:skuId', async (req, res, next) => {
  try {
    const skuId = parseInt(req.params.skuId, 10);
    const { specName, price, sort, enabled } = req.body;
    const sku = await prisma.productSku.update({
      where: { id: skuId },
      data: {
        specName: specName?.trim(),
        price: price !== undefined ? Number(price) : undefined,
        sort: sort !== undefined ? Number(sort) : undefined,
        enabled: enabled !== undefined ? Boolean(enabled) : undefined,
      },
    });
    return success(res, { ...sku, price: Number(sku.price) }, '更新成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, 'SKU 不存在', 404, 404);
    }
    return next(err);
  }
});

router.delete('/:productId/skus/:skuId', async (req, res, next) => {
  try {
    const skuId = parseInt(req.params.skuId, 10);
    await prisma.productSku.delete({ where: { id: skuId } });
    return success(res, null, '删除成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, 'SKU 不存在', 404, 404);
    }
    return next(err);
  }
});

// 商品详情图（多图）
router.get('/:id/detail-images', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await ensureProductExists(productId);
    const images = await prisma.productDetailImage.findMany({
      where: { productId },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return success(res, images);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.post('/:id/detail-images', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await ensureProductExists(productId);
    const { url, sort } = req.body;
    if (!url?.trim()) {
      return fail(res, '图片地址不能为空');
    }
    const maxSort = await prisma.productDetailImage.aggregate({
      where: { productId },
      _max: { sort: true },
    });
    const image = await prisma.productDetailImage.create({
      data: {
        productId,
        url: url.trim(),
        sort: sort !== undefined ? Number(sort) : (maxSort._max.sort ?? -1) + 1,
      },
    });
    return success(res, image, '添加成功');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/:id/detail-images/sort', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await ensureProductExists(productId);
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, '排序数据无效');
    }
    await prisma.$transaction(
      items.map((item) =>
        prisma.productDetailImage.update({
          where: { id: Number(item.id) },
          data: { sort: Number(item.sort) },
        })
      )
    );
    const images = await prisma.productDetailImage.findMany({
      where: { productId },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return success(res, images, '排序已更新');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.delete('/:id/detail-images/:imageId', async (req, res, next) => {
  try {
    const imageId = parseInt(req.params.imageId, 10);
    const productId = parseInt(req.params.id, 10);
    const image = await prisma.productDetailImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      return fail(res, '图片不存在', 404, 404);
    }
    await prisma.productDetailImage.delete({ where: { id: imageId } });
    return success(res, null, '删除成功');
  } catch (err) {
    return next(err);
  }
});

// 商品参数
router.get('/:id/params', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await ensureProductExists(productId);
    let params = await prisma.productParam.findMany({
      where: { productId },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    if (params.length === 0) {
      await initDefaultParams(productId);
      params = await prisma.productParam.findMany({
        where: { productId },
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      });
    }
    return success(res, params);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.post('/:id/params', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await ensureProductExists(productId);
    const { name, value = '', sort } = req.body;
    if (!name?.trim()) {
      return fail(res, '参数名称不能为空');
    }
    const maxSort = await prisma.productParam.aggregate({
      where: { productId },
      _max: { sort: true },
    });
    const param = await prisma.productParam.create({
      data: {
        productId,
        name: name.trim(),
        value: String(value ?? '').trim(),
        sort: sort !== undefined ? Number(sort) : (maxSort._max.sort ?? -1) + 1,
      },
    });
    return success(res, param, '添加成功');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

// 须在 /:paramId 之前注册，避免 "batch" 被当作 paramId
router.put('/:id/params/batch', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await ensureProductExists(productId);
    const { params = [] } = req.body;
    if (!Array.isArray(params) || params.length === 0) {
      return fail(res, '参数列表格式错误');
    }

    for (const item of params) {
      const paramId = Number(item.id);
      if (!paramId || !item.name?.trim()) {
        return fail(res, '参数 id 或名称无效');
      }
    }

    await prisma.$transaction(
      params.map((item) =>
        prisma.productParam.update({
          where: { id: Number(item.id) },
          data: {
            name: item.name.trim(),
            value: item.value !== undefined ? String(item.value).trim() : '',
            sort: Number(item.sort) || 0,
          },
        })
      )
    );

    const list = await prisma.productParam.findMany({
      where: { productId },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return success(res, list, '保存成功');
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/params/add-defaults', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await ensureProductExists(productId);
    const existing = await prisma.productParam.findMany({ where: { productId } });
    const existingNames = new Set(existing.map((p) => p.name));
    const toAdd = DEFAULT_PRODUCT_PARAMS.filter((p) => !existingNames.has(p.name));
    if (toAdd.length === 0) {
      return success(res, existing, '默认参数已存在');
    }
    const maxSort = existing.reduce((max, p) => Math.max(max, p.sort), -1);
    await prisma.productParam.createMany({
      data: toAdd.map((item, i) => ({
        productId,
        name: item.name,
        value: item.value,
        sort: maxSort + 1 + i,
      })),
    });
    const list = await prisma.productParam.findMany({
      where: { productId },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return success(res, list, '已添加缺失的默认参数');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/:id/params/:paramId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const paramId = parseInt(req.params.paramId, 10);
    if (Number.isNaN(paramId)) {
      return fail(res, '参数不存在', 404, 404);
    }
    const { name, value, sort } = req.body;

    const existing = await prisma.productParam.findFirst({
      where: { id: paramId, productId },
    });
    if (!existing) {
      return fail(res, '参数不存在', 404, 404);
    }

    const param = await prisma.productParam.update({
      where: { id: paramId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        value: value !== undefined ? String(value).trim() : undefined,
        sort: sort !== undefined ? Number(sort) : undefined,
      },
    });
    return success(res, param, '更新成功');
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id/params/:paramId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const paramId = parseInt(req.params.paramId, 10);
    const existing = await prisma.productParam.findFirst({
      where: { id: paramId, productId },
    });
    if (!existing) {
      return fail(res, '参数不存在', 404, 404);
    }
    await prisma.productParam.delete({ where: { id: paramId } });
    return success(res, null, '删除成功');
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
