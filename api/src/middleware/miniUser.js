const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

function miniUserMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, '请先登录', 401, 401);
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_USER_SECRET || process.env.JWT_SECRET);
    if (payload.role !== 'user') {
      return fail(res, '无效的登录状态', 401, 401);
    }
    req.user = { id: payload.sub, openid: payload.openid };
    return next();
  } catch {
    return fail(res, '登录已过期，请重新登录', 401, 401);
  }
}

module.exports = miniUserMiddleware;
