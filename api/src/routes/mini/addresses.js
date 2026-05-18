const express = require('express');
const prisma = require('../../utils/prisma');
const { success, fail } = require('../../utils/response');
const miniUserMiddleware = require('../../middleware/miniUser');

const router = express.Router();
router.use(miniUserMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.userAddress.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
    return success(res, list);
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, province, city, district, detail, isDefault } = req.body;
    if (!name?.trim() || !phone?.trim() || !province || !city || !district || !detail?.trim()) {
      return fail(res, '请填写完整地址信息');
    }

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.userAddress.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        phone: phone.trim(),
        province: province.trim(),
        city: city.trim(),
        district: district.trim(),
        detail: detail.trim(),
        isDefault: Boolean(isDefault),
      },
    });

    const count = await prisma.userAddress.count({ where: { userId: req.user.id } });
    if (count === 1) {
      await prisma.userAddress.update({
        where: { id: address.id },
        data: { isDefault: true },
      });
      address.isDefault = true;
    }

    return success(res, address, '添加成功');
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return fail(res, '地址不存在', 404, 404);
    }

    const { name, phone, province, city, district, detail, isDefault } = req.body;

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.userAddress.update({
      where: { id },
      data: {
        name: name?.trim(),
        phone: phone?.trim(),
        province: province?.trim(),
        city: city?.trim(),
        district: district?.trim(),
        detail: detail?.trim(),
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
      },
    });
    return success(res, address, '更新成功');
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return fail(res, '地址不存在', 404, 404);
    }
    await prisma.userAddress.delete({ where: { id } });

    if (existing.isDefault) {
      const first = await prisma.userAddress.findFirst({
        where: { userId: req.user.id },
        orderBy: { id: 'desc' },
      });
      if (first) {
        await prisma.userAddress.update({
          where: { id: first.id },
          data: { isDefault: true },
        });
      }
    }

    return success(res, null, '删除成功');
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
