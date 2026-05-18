import request from '@/utils/request'

export function getOrders(params) {
  return request.get('/orders', { params })
}

export function getOrder(id) {
  return request.get(`/orders/${id}`)
}

export function updateOrderStatus(id, status) {
  return request.patch(`/orders/${id}/status`, { status })
}

export function addOrderLog(id, content) {
  return request.post(`/orders/${id}/logs`, { content })
}
