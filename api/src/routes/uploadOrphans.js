const express = require('express');
const { success, fail } = require('../utils/response');
const { scanOrphans, deleteOrphans } = require('../services/uploadOrphanService');

const router = express.Router();

router.get('/orphans', async (req, res, next) => {
  try {
    const result = await scanOrphans();
    return success(res, result);
  } catch (err) {
    return next(err);
  }
});

router.post('/orphans/delete', async (req, res, next) => {
  try {
    const { paths } = req.body || {};
    if (!Array.isArray(paths) || paths.length === 0) {
      return fail(res, '请选择要删除的文件');
    }
    const result = await deleteOrphans(paths);
    return success(res, result, '删除完成');
  } catch (err) {
    if (err.status) {
      return fail(res, err.message, err.status, err.status);
    }
    return next(err);
  }
});

module.exports = router;
