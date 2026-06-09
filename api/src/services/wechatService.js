const crypto = require('crypto');

let accessTokenCache = { token: null, expiresAt: 0 };

function isDevLoginCode(code) {
  return typeof code === 'string' && (code === 'dev' || code.startsWith('dev_'));
}

function resolveDevSession() {
  if (process.env.NODE_ENV !== 'development' || !process.env.WECHAT_DEV_OPENID) {
    return null;
  }
  return {
    openid: process.env.WECHAT_DEV_OPENID,
    session_key: 'dev',
    unionid: null,
  };
}

async function code2Session(code) {
  const devSession = isDevLoginCode(code) ? resolveDevSession() : null;
  if (devSession) {
    return devSession;
  }

  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_SECRET;

  if (!appid || !secret) {
    const fallback = resolveDevSession();
    if (fallback) {
      return fallback;
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

const {
  isRealPayEnabled,
  createJsapiPayment,
} = require('./wechatPayService');

function getPayApiKey() {
  return process.env.WECHAT_PAY_API_V3_KEY || process.env.WECHAT_PAY_API_KEY || '';
}

function isPayConfigured() {
  return isRealPayEnabled();
}

function createMockJsapiPayParams(order) {
  return {
    mock: true,
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: crypto.randomBytes(16).toString('hex'),
    package: `prepay_id=mock_${order.orderNo}`,
    signType: 'RSA',
    paySign: 'MOCK_SIGN',
  };
}

/**
 * 开发环境 mock 支付参数；生产对接微信支付 V3 JSAPI
 */
async function createJsapiPayParams(order, openid, clientIp) {
  if (!isRealPayEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      return createMockJsapiPayParams(order);
    }
    if (!getPayApiKey() || !process.env.WECHAT_MCH_ID || !process.env.WECHAT_APPID) {
      const err = new Error('微信支付未配置');
      err.status = 503;
      throw err;
    }
    const err = new Error('微信支付未启用');
    err.status = 503;
    throw err;
  }

  return createJsapiPayment(order, openid, clientIp);
}

/**
 * 生成商品小程序码（货架扫码直达商品详情）
 * scene 最长 32 字符，格式 id=商品ID
 */
async function getProductWxacode(productId) {
  const scene = `id=${productId}`;
  if (scene.length > 32) {
    const err = new Error('商品 ID 超出小程序码 scene 长度限制');
    err.status = 400;
    throw err;
  }

  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_SECRET;

  if (!appid || !secret) {
    if (process.env.NODE_ENV === 'development') {
      const QRCode = require('qrcode');
      const buffer = await QRCode.toBuffer(`mina-product:${productId}`, {
        width: 430,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      return { buffer, mock: true };
    }
    const err = new Error('微信小程序未配置，无法生成二维码');
    err.status = 503;
    throw err;
  }

  const accessToken = await getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scene,
      page: 'pages/product/detail',
      check_path: false,
      width: 430,
      env_version: process.env.WECHAT_ENV_VERSION || 'release',
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    const err = new Error(data.errmsg || '生成小程序码失败');
    err.status = 400;
    throw err;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mock: false };
}

module.exports = {
  code2Session,
  getAccessToken,
  getPhoneNumber,
  createJsapiPayParams,
  isPayConfigured,
  getProductWxacode,
};
