import { payWechat, mockPaySuccess, syncPayStatus } from '@/api/order'

/** 板布订单发起微信支付；开发环境 mock 时自动调 mock-success */
export async function paySampleOrder(orderId) {
  const payRes = await payWechat(orderId)
  const payment = payRes.data.payment
  if (payment.mock) {
    if (import.meta.env.PROD) {
      throw new Error('支付服务未就绪，请联系管理员')
    }
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
  await syncPayStatus(orderId)
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

/** 支付服务配置错误时明确提示 */
export function showPayErrorModal(message) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '支付失败',
      content: message || '支付服务暂不可用，请稍后重试',
      showCancel: false,
      success: resolve,
    })
  })
}
