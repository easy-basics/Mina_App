import request from '@/utils/request'

export function getProducts(params) {
  return request.get('/products', { params })
}

export function getProductSortList(categoryId) {
  return request.get('/products/sort-list', { params: { categoryId } })
}

export function getHomeProductSortList() {
  return request.get('/products/home-sort-list')
}

export function sortProducts(categoryId, items) {
  return request.put('/products/sort', { categoryId, items })
}

export function sortHomeProducts(items) {
  return request.put('/products/home-sort', { items })
}

export function getProduct(id) {
  return request.get(`/products/${id}`)
}

export function createProduct(data) {
  return request.post('/products', data)
}

export function updateProduct(id, data) {
  return request.put(`/products/${id}`, data)
}

export function deleteProduct(id) {
  return request.delete(`/products/${id}`)
}

export function getSkus(productId) {
  return request.get(`/products/${productId}/skus`)
}

export function createSku(productId, data) {
  return request.post(`/products/${productId}/skus`, data)
}

export function updateSku(productId, skuId, data) {
  return request.put(`/products/${productId}/skus/${skuId}`, data)
}

export function deleteSku(productId, skuId) {
  return request.delete(`/products/${productId}/skus/${skuId}`)
}

export function sortSkus(productId, items) {
  return request.put(`/products/${productId}/skus/sort`, { items })
}

// 商品详情图
export function addDetailImage(productId, data) {
  return request.post(`/products/${productId}/detail-images`, data)
}

export function deleteDetailImage(productId, imageId) {
  return request.delete(`/products/${productId}/detail-images/${imageId}`)
}

export function sortDetailImages(productId, items) {
  return request.put(`/products/${productId}/detail-images/sort`, { items })
}

// 商品参数
export function createParam(productId, data) {
  return request.post(`/products/${productId}/params`, data)
}

export function updateParam(productId, paramId, data) {
  return request.put(`/products/${productId}/params/${paramId}`, data)
}

export function batchUpdateParams(productId, params) {
  return request.put(`/products/${productId}/params/batch`, { params })
}

export function deleteParam(productId, paramId) {
  return request.delete(`/products/${productId}/params/${paramId}`)
}

export function addDefaultParams(productId) {
  return request.post(`/products/${productId}/params/add-defaults`)
}

export function getProductQrcode(productId) {
  return request.get(`/products/${productId}/qrcode`)
}
