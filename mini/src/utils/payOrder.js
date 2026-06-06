import { payWechat, mockPaySuccess } from '@/api/order'

/** 板布订单发起微信支付；开发环境 mock 时自动调 mock-success */
export async function paySampleOrder(orderId) {
  const payRes = await payWechat(orderId)
  const payment = payRes.data.payment
  if (payment.mock) {
    await mockPaySuccess(orderId)
    return { paid: true, mock: true }
  }
  await new Promise((resolve, reject) => {
    uni.requestPayment({
      ...payment,
      success: resolve,
      fail: reject,
    })
  })
  return { paid: true, mock: false }
}

/** 支付失败时提示用户可在订单列表继续支付 */
export function showPayIncompleteModal() {
  return new Promise((resolve) => {
    uni.showModal({
      title: '订单已创建',
      content: '支付未完成，可在我的订单中继续支付',
      showCancel: false,
      success: resolve,
    })
  })
}
