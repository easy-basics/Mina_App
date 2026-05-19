import request from '@/utils/request'

export function getCategories(params) {
  return request.get('/categories', { params })
}

export function getAllCategories() {
  return request.get('/categories/all')
}

export function getCategorySortList() {
  return request.get('/categories/sort-list')
}

export function sortCategories(items) {
  return request.put('/categories/sort', { items })
}

export function createCategory(data) {
  return request.post('/categories', data)
}

export function updateCategory(id, data) {
  return request.put(`/categories/${id}`, data)
}

export function deleteCategory(id) {
  return request.delete(`/categories/${id}`)
}
