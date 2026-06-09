const fs = require('fs');
const path = require('path');

let payClient = null;
let WxPayClass = null;

function loadWxPayClass() {
  if (WxPayClass) {
    return WxPayClass;
  }
  try {
    WxPayClass = require('wechatpay-node-v3');
    return WxPayClass;
  } catch {
    const err = new Error('微信支付依赖未安装，请在 api 目录执行 npm install');
    err.status = 503;
    throw err;
  }
}

function getPayApiKey() {
  return process.env.WECHAT_PAY_API_V3_KEY || process.env.WECHAT_PAY_API_KEY || '';
}

function readPem(envPathKey, envInlineKey) {
  const inline = process.env[envInlineKey];
  if (inline) {
    return Buffer.from(inline.replace(/\\n/g, '\n'));
  }
  const filePath = process.env[envPathKey];
  if (!filePath) {
    return null;
  }
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  return fs.readFileSync(resolved);
}

function getPayClient() {
  if (payClient) {
    return payClient;
  }

  const publicKey = readPem('WECHAT_MCH_CERT_PATH', 'WECHAT_MCH_CERT');
  const privateKey = readPem('WECHAT_MCH_PRIVATE_KEY_PATH', 'WECHAT_MCH_PRIVATE_KEY');
  if (!publicKey || !privateKey) {
    const err = new Error('微信支付证书未配置');
    err.status = 503;
    throw err;
  }

  payClient = new (loadWxPayClass())({
    appid: process.env.WECHAT_APPID,
    mchid: process.env.WECHAT_MCH_ID,
    serial_no: process.env.WECHAT_MCH_SERIAL_NO || undefined,
    publicKey,
    privateKey,
    key: getPayApiKey(),
  });

  return payClient;
}

function isRealPayEnabled() {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  const apiKey = getPayApiKey();
  const hasCert =
    (process.env.WECHAT_MCH_CERT_PATH || process.env.WECHAT_MCH_CERT) &&
    (process.env.WECHAT_MCH_PRIVATE_KEY_PATH || process.env.WECHAT_MCH_PRIVATE_KEY);

  return !!(
    process.env.WECHAT_APPID &&
    process.env.WECHAT_MCH_ID &&
    process.env.WECHAT_MCH_SERIAL_NO &&
    apiKey &&
    hasCert
  );
}

function getNotifyUrl() {
  const base = (process.env.API_PUBLIC_URL || '').replace(/\/$/, '');
  if (!base) {
    const err = new Error('API_PUBLIC_URL 未配置，无法生成支付回调地址');
    err.status = 503;
    throw err;
  }
  return `${base}/api/mini/pay/notify`;
}

function toFen(amount) {
  return Math.round(Number(amount) * 100);
}

function mapJsapiResult(result) {
  if (result.status !== 200 || !result.data?.package) {
    const message =
      result.data?.message ||
      result.data?.code ||
      result.error?.message ||
      '微信下单失败';
    const err = new Error(message);
    err.status = 502;
    throw err;
  }

  const { appId, timeStamp, nonceStr, package: pkg, signType, paySign } = result.data;
  return {
    appId,
    timeStamp,
    nonceStr,
    package: pkg,
    signType,
    paySign,
  };
}

async function createJsapiPayment(order, openid, clientIp) {
  const pay = getPayClient();
  const total = toFen(order.totalAmount);
  if (total < 1) {
    const err = new Error('订单金额无效');
    err.status = 400;
    throw err;
  }

  const params = {
    description: `布版订单 ${order.orderNo}`,
    out_trade_no: order.orderNo,
    notify_url: getNotifyUrl(),
    amount: { total },
    payer: { openid },
  };

  if (clientIp) {
    params.scene_info = { payer_client_ip: clientIp };
  }

  const result = await pay.transactions_jsapi(params);
  return mapJsapiResult(result);
}

async function handlePaymentNotify(headers, rawBody) {
  const pay = getPayClient();
  const apiKey = getPayApiKey();
  const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

  const verified = await pay.verifySign({
    timestamp: headers['wechatpay-timestamp'],
    nonce: headers['wechatpay-nonce'],
    body: bodyStr,
    serial: headers['wechatpay-serial'],
    signature: headers['wechatpay-signature'],
    apiSecret: apiKey,
  });

  if (!verified) {
    const err = new Error('微信支付回调验签失败');
    err.status = 401;
    throw err;
  }

  const payload = JSON.parse(bodyStr);
  const resource = payload.resource;
  if (!resource?.ciphertext) {
    const err = new Error('微信支付回调缺少加密资源');
    err.status = 400;
    throw err;
  }

  const decrypted = pay.decipher_gcm(
    resource.ciphertext,
    resource.associated_data,
    resource.nonce,
    apiKey
  );
  const data = JSON.parse(decrypted);

  if (data.trade_state !== 'SUCCESS') {
    const err = new Error(`非支付成功回调: ${data.trade_state || payload.event_type}`);
    err.status = 400;
    throw err;
  }

  return {
    outTradeNo: data.out_trade_no,
    transactionId: data.transaction_id,
  };
}

async function queryPaymentByOrderNo(outTradeNo) {
  const pay = getPayClient();
  const result = await pay.query({ out_trade_no: outTradeNo });
  if (result.status !== 200) {
    const err = new Error(result.data?.message || '查询微信支付订单失败');
    err.status = 502;
    throw err;
  }
  return result.data;
}

module.exports = {
  isRealPayEnabled,
  createJsapiPayment,
  handlePaymentNotify,
  queryPaymentByOrderNo,
};
