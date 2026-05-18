const crypto = require('crypto');

async function code2Session(code) {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_SECRET;

  if (!appid || !secret) {
    if (process.env.NODE_ENV === 'development' && process.env.WECHAT_DEV_OPENID) {
      return {
        openid: process.env.WECHAT_DEV_OPENID,
        session_key: 'dev',
        unionid: null,
      };
    }
    const err = new Error('微信登录未配置，请设置 WECHAT_APPID 和 WECHAT_SECRET');
    err.status = 503;
    throw err;
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) {
    const err = new Error(data.errmsg || '微信登录失败');
    err.status = 400;
    throw err;
  }
  return data;
}

function isPayConfigured() {
  return !!(process.env.WECHAT_MCH_ID && process.env.WECHAT_PAY_API_KEY && process.env.WECHAT_APPID);
}

/**
 * 开发环境 mock 支付参数；生产需对接微信支付 V3 API
 */
function createJsapiPayParams(order) {
  if (!isPayConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      return {
        mock: true,
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: crypto.randomBytes(16).toString('hex'),
        package: `prepay_id=mock_${order.orderNo}`,
        signType: 'RSA',
        paySign: 'MOCK_SIGN',
      };
    }
    const err = new Error('微信支付未配置');
    err.status = 503;
    throw err;
  }

  const err = new Error('微信支付接口待配置商户证书后启用');
  err.status = 503;
  throw err;
}

module.exports = {
  code2Session,
  createJsapiPayParams,
  isPayConfigured,
};
