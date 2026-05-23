const crypto = require('crypto');

let accessTokenCache = { token: null, expiresAt: 0 };

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

async function getAccessToken() {
  const now = Date.now();
  if (accessTokenCache.token && accessTokenCache.expiresAt > now + 60000) {
    return accessTokenCache.token;
  }

  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_SECRET;
  if (!appid || !secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'dev_access_token';
    }
    const err = new Error('微信登录未配置，请设置 WECHAT_APPID 和 WECHAT_SECRET');
    err.status = 503;
    throw err;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) {
    const err = new Error(data.errmsg || '获取 access_token 失败');
    err.status = 400;
    throw err;
  }

  accessTokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 7200) * 1000,
  };
  return data.access_token;
}

async function getPhoneNumber(code) {
  if (!code) {
    const err = new Error('缺少手机号授权 code');
    err.status = 400;
    throw err;
  }

  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_SECRET;
  if (!appid || !secret) {
    if (process.env.NODE_ENV === 'development' && process.env.WECHAT_DEV_OPENID) {
      const devPhone = process.env.WECHAT_DEV_PHONE || '13800000000';
      return {
        phoneNumber: devPhone,
        purePhoneNumber: devPhone,
        countryCode: '86',
      };
    }
    const err = new Error('微信手机号未配置');
    err.status = 503;
    throw err;
  }

  const accessToken = await getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (data.errcode) {
    const err = new Error(data.errmsg || '获取手机号失败');
    err.status = 400;
    throw err;
  }
  return data.phone_info;
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
  getAccessToken,
  getPhoneNumber,
  createJsapiPayParams,
  isPayConfigured,
};
