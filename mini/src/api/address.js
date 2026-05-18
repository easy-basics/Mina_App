import { request } from '@/utils/request'

export function getAddresses() {
  return request({ url: '/mini/addresses' })
}

export function createAddress(data) {
  return request({ url: '/mini/addresses', method: 'POST', data })
}

export function updateAddress(id, data) {
  return request({ url: `/mini/addresses/${id}`, method: 'PUT', data })
}

export function deleteAddress(id) {
  return request({ url: `/mini/addresses/${id}`, method: 'DELETE' })
}
