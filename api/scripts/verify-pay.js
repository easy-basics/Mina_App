/**
 * 验证微信支付配置是否启用真实 JSAPI（非 mock）
 * 用法: node scripts/verify-pay.js
 */
require('dotenv').config();
const {
  isRealPayEnabled,
  getRealPayDisableReasons,
} = require('../src/services/wechatPayService');
const { createJsapiPayParams } = require('../src/services/wechatService');
const prisma = require('../src/utils/prisma');

async function main() {
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('API_PUBLIC_URL:', process.env.API_PUBLIC_URL);
  console.log('isRealPayEnabled:', isRealPayEnabled());

  if (!isRealPayEnabled()) {
    console.error('\nFAIL: 真实支付未启用：');
    getRealPayDisableReasons().forEach((r) => console.error('  -', r));
    process.exit(1);
  }

  const users = await prisma.user.findMany({ orderBy: { id: 'asc' }, take: 20 });
  const user = users.find((u) => u.openid);
  if (!user?.openid) {
    console.error('\nFAIL: 数据库中无带 openid 的用户，无法测试 JSAPI 下单。');
    process.exit(1);
  }

  const testOrder = {
    orderNo: `TEST${Date.now()}`,
    totalAmount: '0.01',
  };

  try {
    const payment = await createJsapiPayParams(testOrder, user.openid, '127.0.0.1');
    if (payment.mock) {
      console.error('\nFAIL: 返回了 mock 支付参数，体验版不会唤起微信支付。');
      process.exit(1);
    }
    if (!payment.package?.startsWith('prepay_id=')) {
      console.error('\nFAIL: package 字段异常:', payment.package);
      process.exit(1);
    }
    console.log('\nOK: 微信支付 JSAPI 参数生成成功');
    console.log('  package:', payment.package.slice(0, 30) + '...');
    console.log('  hasPaySign:', !!payment.paySign);
  } catch (err) {
    console.error('\nFAIL:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
