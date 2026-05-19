const express = require('express');
const prisma = require('../utils/prisma');
const { success, fail } = require('../utils/response');
const { applySortUpdates } = require('../utils/sortBatch');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const keyword = req.query.keyword?.trim();

    const where = {
      parentId: null,
      ...(keyword ? { name: { contains: keyword } } : {}),
    };

    const [list, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { products: true } } },
      }),
      prisma.category.count({ where }),
    ]);

    return success(res, { list, total, page, pageSize });
  } catch (err) {
    return next(err);
  }
});

router.get('/all', async (req, res, next) => {
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

router.get('/sort-list', async (req, res, next) => {
  try {
    const list = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return success(res, list);
  } catch (err) {
    return next(err);
  }
});

router.put('/sort', async (req, res, next) => {
  try {
    const { items = [] } = req.body;
    await applySortUpdates('category', items, { parentId: null });
    return success(res, null, '排序已更新');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, sort = 0, enabled = true } = req.body;
    if (!name?.trim()) {
      return fail(res, '系列名称不能为空');
    }
    const category = await prisma.category.create({
      data: {
        parentId: null,
        name: name.trim(),
        sort: Number(sort) || 0,
        enabled: Boolean(enabled),
      },
    });
    return success(res, category, '创建成功');
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, sort, enabled } = req.body;
    if (!name?.trim()) {
      return fail(res, '系列名称不能为空');
    }
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        sort: sort !== undefined ? Number(sort) : undefined,
        enabled: enabled !== undefined ? Boolean(enabled) : undefined,
      },
    });
    return success(res, category, '更新成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, '系列不存在', 404, 404);
    }
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return fail(res, '该系列下仍有商品，无法删除');
    }
    await prisma.category.delete({ where: { id } });
    return success(res, null, '删除成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, '系列不存在', 404, 404);
    }
    return next(err);
  }
});

module.exports = router;
