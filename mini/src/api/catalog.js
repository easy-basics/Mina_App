import { request } from '@/utils/request'

export function getCategories() {
  return request({ url: '/mini/catalog/categories', auth: false })
}

export function getCategoryDetail(id) {
  return request({ url: `/mini/catalog/categories/${id}`, auth: false })
}

export function getProducts(params) {
  return request({ url: '/mini/catalog/products', data: params, auth: false })
}

export function getHomeProducts() {
  return request({ url: '/mini/catalog/home-products', auth: false })
}

export function getHomeContent() {
  return request({ url: '/mini/catalog/home-content', auth: false })
}

export function getProduct(id) {
  return request({ url: `/mini/catalog/products/${id}`, auth: false })
}

export function getShopInfo() {
  return request({ url: '/mini/catalog/shop-info', auth: false })
}
