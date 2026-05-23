import { request } from '@/utils/request'

export function getMe() {
  return request({ url: '/mini/auth/me' })
}

export function updateProfile(data) {
  return request({ url: '/mini/auth/profile', method: 'PUT', data })
}

export function bindPhone(code) {
  return request({ url: '/mini/auth/phone', method: 'POST', data: { code } })
}
