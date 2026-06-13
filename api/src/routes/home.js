const express = require('express');
const { success, fail } = require('../utils/response');
const {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  sortBanners,
  getBrandAdmin,
  updateBrandIntro,
  createBrandSection,
  updateBrandSection,
  deleteBrandSection,
  sortBrandSections,
} = require('../services/homeContentService');

const router = express.Router();

router.get('/banners', async (req, res, next) => {
  try {
    const list = await listBanners();
    return success(res, list);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.post('/banners', async (req, res, next) => {
  try {
    const row = await createBanner(req.body);
    return success(res, row, '创建成功');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/banners/sort', async (req, res, next) => {
  try {
    await sortBanners(req.body.items);
    return success(res, null, '排序已更新');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/banners/:id', async (req, res, next) => {
  try {
    const row = await updateBanner(req.params.id, req.body);
    return success(res, row, '更新成功');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, '轮播图不存在', 404, 404);
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.delete('/banners/:id', async (req, res, next) => {
  try {
    await deleteBanner(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, '轮播图不存在', 404, 404);
    return next(err);
  }
});

router.get('/brand', async (req, res, next) => {
  try {
    const data = await getBrandAdmin();
    return success(res, data);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/brand', async (req, res, next) => {
  try {
    const row = await updateBrandIntro(req.body);
    return success(res, row, '保存成功');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.post('/brand/sections', async (req, res, next) => {
  try {
    const row = await createBrandSection(req.body);
    return success(res, row, '创建成功');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/brand/sections/sort', async (req, res, next) => {
  try {
    await sortBrandSections(req.body.items);
    return success(res, null, '排序已更新');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.put('/brand/sections/:id', async (req, res, next) => {
  try {
    const row = await updateBrandSection(req.params.id, req.body);
    return success(res, row, '更新成功');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, '段落不存在', 404, 404);
    if (err.status) return fail(res, err.message, err.status, err.status);
    return next(err);
  }
});

router.delete('/brand/sections/:id', async (req, res, next) => {
  try {
    await deleteBrandSection(req.params.id);
    return success(res, null, '删除成功');
  } catch (err) {
    if (err.code === 'P2025') return fail(res, '段落不存在', 404, 404);
    return next(err);
  }
});

module.exports = router;
