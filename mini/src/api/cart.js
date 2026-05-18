import { request } from '@/utils/request'

export function getCart() {
  return request({ url: '/mini/cart' })
}

export function addToCart(data) {
  return request({ url: '/mini/cart', method: 'POST', data })
}

export function updateCartItem(id, data) {
  return request({ url: `/mini/cart/${id}`, method: 'PUT', data })
}

export function removeCartItem(id) {
  return request({ url: `/mini/cart/${id}`, method: 'DELETE' })
}
