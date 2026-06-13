import { payWechat, mockPaySuccess, syncPayStatus } from '@/api/order'

const SYNC_MAX_ATTEMPTS = 6
const SYNC_DELAY_MS = 800

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 轮询服务端同步微信支付结果（支付完成后微信侧可能有短暂延迟） */
async function trySyncPaid(orderId) {
  for (let i = 0; i < SYNC_MAX_ATTEMPTS; i++) {
    try {
      const res = await syncPayStatus(orderId)
      if (res.data?.paid) return true
    } catch (e) {
      console.warn('[pay] sync attempt failed', i + 1, e?.message || e)
    }
    if (i < SYNC_MAX_ATTEMPTS - 1) await delay(SYNC_DELAY_MS)
  }
  return false
}

function invokeRequestPayment(payment) {
  const { appId, ...rest } = payment || {}
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      ...rest,
      timeStamp: String(rest.timeStamp ?? ''),
      success: resolve,
      fail: reject,
    })
  })
}

export function isPayCancelled(err) {
  const msg = String(err?.errMsg || err?.message || '')
  return /cancel|取消/.test(msg)
}

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

  try {
    await invokeRequestPayment(payment)
  } catch (payErr) {
    // 少数情况下 requestPayment 报错但微信已扣款，尝试 sync 确认
    if (!isPayCancelled(payErr)) {
      const synced = await trySyncPaid(orderId)
      if (synced) return { paid: true, mock: false, recovered: true }
    }
    throw payErr
  }

  // 用户已在微信完成支付；sync 失败不应视为未支付（回调会最终对齐订单状态）
  await trySyncPaid(orderId)
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
