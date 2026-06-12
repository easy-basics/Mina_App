import request from '@/utils/request'

export function getShopSettings() {
  return request.get('/shop')
}

export function updateShopSettings(data) {
  return request.put('/shop', data)
}
