import request from '@/utils/request'

export function getHomeBanners() {
  return request.get('/home/banners')
}

export function createHomeBanner(data) {
  return request.post('/home/banners', data)
}

export function updateHomeBanner(id, data) {
  return request.put(`/home/banners/${id}`, data)
}

export function deleteHomeBanner(id) {
  return request.delete(`/home/banners/${id}`)
}

export function sortHomeBanners(items) {
  return request.put('/home/banners/sort', { items })
}

export function getBrandContent() {
  return request.get('/home/brand')
}

export function updateBrandContent(data) {
  return request.put('/home/brand', data)
}

export function createBrandSection(data) {
  return request.post('/home/brand/sections', data)
}

export function updateBrandSection(id, data) {
  return request.put(`/home/brand/sections/${id}`, data)
}

export function deleteBrandSection(id) {
  return request.delete(`/home/brand/sections/${id}`)
}

export function sortBrandSections(items) {
  return request.put('/home/brand/sections/sort', { items })
}
