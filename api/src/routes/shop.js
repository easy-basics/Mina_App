const express = require('express');
const { success, fail } = require('../utils/response');
const {
  getShopProfile,
  serializeProfile,
  updateShopProfile,
} = require('../services/shopSettingsService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const profile = await getShopProfile();
    return success(res, serializeProfile(profile));
  } catch (err) {
    return next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const profile = await updateShopProfile(req.body);
    return success(res, profile, '保存成功');
  } catch (err) {
    if (err.status) {
      return fail(res, err.message, err.status, err.status);
    }
    return next(err);
  }
});

module.exports = router;
