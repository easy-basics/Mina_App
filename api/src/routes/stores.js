const express = require('express');
const prisma = require('../utils/prisma');
const { success, fail } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const keyword = req.query.keyword?.trim();

    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { contact: { contains: keyword } },
            { phone: { contains: keyword } },
          ],
        }
      : {};

    const [list, total] = await Promise.all([
      prisma.store.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.store.count({ where }),
    ]);

    return success(res, { list, total, page, pageSize });
  } catch (err) {
    return next(err);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const list = await prisma.store.findMany({
      where: { enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return success(res, list);
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, address, phone, contact, enabled = true, sort = 0 } = req.body;
    if (!name?.trim()) {
      return fail(res, '门店名称不能为空');
    }
    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        contact: contact?.trim() || null,
        enabled: Boolean(enabled),
        sort: Number(sort) || 0,
      },
    });
    return success(res, store, '创建成功');
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, address, phone, contact, enabled, sort } = req.body;
    if (!name?.trim()) {
      return fail(res, '门店名称不能为空');
    }
    const store = await prisma.store.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        contact: contact?.trim() || null,
        enabled: enabled !== undefined ? Boolean(enabled) : undefined,
        sort: sort !== undefined ? Number(sort) : undefined,
      },
    });
    return success(res, store, '更新成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, '门店不存在', 404, 404);
    }
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.store.delete({ where: { id } });
    return success(res, null, '删除成功');
  } catch (err) {
    if (err.code === 'P2025') {
      return fail(res, '门店不存在', 404, 404);
    }
    return next(err);
  }
});

module.exports = router;
