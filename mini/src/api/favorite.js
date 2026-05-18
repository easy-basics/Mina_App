import { request } from '@/utils/request'

export function getFavorites() {
  return request({ url: '/mini/favorites' })
}

export function addFavorite(productId) {
  return request({ url: `/mini/favorites/${productId}`, method: 'POST' })
}

export function removeFavorite(productId) {
  return request({ url: `/mini/favorites/${productId}`, method: 'DELETE' })
}
