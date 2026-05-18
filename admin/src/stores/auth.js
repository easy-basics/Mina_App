import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getMe, logout as logoutApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(sessionStorage.getItem('token') || '')
  const admin = ref(JSON.parse(sessionStorage.getItem('admin') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setSession(newToken, newAdmin) {
    token.value = newToken
    admin.value = newAdmin
    sessionStorage.setItem('token', newToken)
    sessionStorage.setItem('admin', JSON.stringify(newAdmin))
  }

  function clearSession() {
    token.value = ''
    admin.value = null
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('admin')
  }

  async function login(username, password) {
    const res = await loginApi({ username, password })
    setSession(res.data.token, res.data.admin)
    return res.data
  }

  async function fetchMe() {
    const res = await getMe()
    admin.value = res.data
    sessionStorage.setItem('admin', JSON.stringify(res.data))
    return res.data
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      clearSession()
    }
  }

  return {
    token,
    admin,
    isLoggedIn,
    login,
    fetchMe,
    logout,
    clearSession,
  }
})
