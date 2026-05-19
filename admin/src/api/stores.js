import request from '@/utils/request'

export function getStores(params) {
  return request.get('/stores', { params })
}

export function getAllStores() {
  return request.get('/stores/all')
}

export function getStoreSortList() {
  return request.get('/stores/sort-list')
}

export function sortStores(items) {
  return request.put('/stores/sort', { items })
}

export function createStore(data) {
  return request.post('/stores', data)
}

export function updateStore(id, data) {
  return request.put(`/stores/${id}`, data)
}

export function deleteStore(id) {
  return request.delete(`/stores/${id}`)
}
