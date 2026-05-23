import { defineStore } from 'pinia'
import { loginWithWechat } from '@/utils/request'
import { getMe } from '@/api/auth'

function persistUser(user) {
  if (user) {
    uni.setStorageSync('user', JSON.stringify(user))
  } else {
    uni.removeStorageSync('user')
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(uni.getStorageSync('user') || 'null'),
    token: uni.getStorageSync('token') || '',
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    displayName: (s) => s.user?.realName || s.user?.nickname || '微信用户',
  },
  actions: {
    async login(profile) {
      const data = await loginWithWechat(profile)
      this.token = data.token
      this.user = data.user
      persistUser(data.user)
      return data
    },
    async fetchProfile() {
      if (!this.token) return null
      const res = await getMe()
      this.user = res.data
      persistUser(res.data)
      return res.data
    },
    patchUser(user) {
      this.user = { ...this.user, ...user }
      persistUser(this.user)
    },
    logout() {
      this.token = ''
      this.user = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('user')
    },
  },
})
