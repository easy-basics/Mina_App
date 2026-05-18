const express = require('express');
const authService = require('../services/authService');
const authMiddleware = require('../middleware/auth');
const loginRateLimit = require('../middleware/loginRateLimit');
const { success, fail } = require('../utils/response');

const router = express.Router();

router.post('/login', loginRateLimit, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password, req);
    return success(res, result);
  } catch (err) {
    if (err.status) {
      return fail(res, err.message, err.status, err.status);
    }
    return next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const admin = await authService.getMe(req.admin.id);
    return success(res, admin);
  } catch (err) {
    if (err.status) {
      return fail(res, err.message, err.status, err.status);
    }
    return next(err);
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  return success(res, null, '已退出登录');
});

module.exports = router;
