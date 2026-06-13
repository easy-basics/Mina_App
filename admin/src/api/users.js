import request from '@/utils/request'

export function getUsers(params) {
  return request.get('/users', { params })
}

export function getUser(id) {
  return request.get(`/users/${id}`)
}

export function deleteUser(id) {
  return request.delete(`/users/${id}`)
}
