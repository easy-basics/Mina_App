import { request } from '@/utils/request'

export function createOrder(data) {
  return request({ url: '/mini/orders', method: 'POST', data })
}

export function getOrders(params) {
  return request({ url: '/mini/orders', data: params })
}

export function getOrder(id) {
  return request({ url: `/mini/orders/${id}` })
}

export function payWechat(orderId) {
  return request({ url: `/mini/pay/wechat/${orderId}`, method: 'POST' })
}

export function mockPaySuccess(orderId) {
  return request({ url: `/mini/pay/mock-success/${orderId}`, method: 'POST' })
}

export function syncPayStatus(orderId) {
  return request({ url: `/mini/pay/sync/${orderId}`, method: 'POST' })
}
