function success(res, data = null, message = 'ok') {
  return res.json({ code: 0, data, message });
}

function fail(res, message = 'error', httpStatus = 400, code = httpStatus) {
  return res.status(httpStatus).json({ code, message, data: null });
}

module.exports = { success, fail };
