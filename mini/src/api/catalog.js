import { request } from '@/utils/request'

export function getCategories() {
  return request({ url: '/mini/catalog/categories', auth: false })
}

export function getProducts(params) {
  return request({ url: '/mini/catalog/products', data: params, auth: false })
}

export function getProduct(id) {
  return request({ url: `/mini/catalog/products/${id}`, auth: false })
}

export function getStores(productId) {
  return request({ url: '/mini/catalog/stores', data: { productId }, auth: false })
}
