import { defineStore } from 'pinia'
import { loginWithWechat } from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(uni.getStorageSync('user') || 'null'),
    token: uni.getStorageSync('token') || '',
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
  },
  actions: {
    async login() {
      const data = await loginWithWechat()
      this.token = data.token
      this.user = data.user
      return data
    },
    logout() {
      this.token = ''
      this.user = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('user')
    },
  },
})
