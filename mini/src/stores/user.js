import { defineStore } from 'pinia'
import { silentLoginWithWechat, persistAuth } from '@/utils/request'
import { getMe, updateProfile } from '@/api/auth'
import { requestWechatProfile } from '@/utils/wechatProfile'

function persistUser(user) {
  persistAuth(undefined, user)
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(uni.getStorageSync('user') || 'null'),
    token: uni.getStorageSync('token') || '',
    authReady: false,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    /** 已保存过头像昵称（含拒绝授权后的随机昵称） */
    hasWechatProfile: (s) => !!s.user?.nickname,
    displayName: (s) => s.user?.realName || s.user?.nickname || '微信用户',
    /** 「我的」页用户区：仅展示 nickname，不被 realName 覆盖 */
    mineNickname: (s) => s.user?.nickname || '',
    mineAvatar: (s) => s.user?.avatar || '',
  },
  actions: {
    /** 启动静默登录：仅换取 token */
    async silentLogin() {
      const data = await silentLoginWithWechat()
      this.token = data.token
      this.user = data.user
      this.authReady = true
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
    /** 获取头像昵称并保存，不做其它动作 */
    async authorizeProfile() {
      const profile = await requestWechatProfile()
      const res = await updateProfile({
        nickname: profile.nickname,
        avatar: profile.avatar,
      })
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
      this.authReady = false
      persistAuth('', null)
    },
  },
})
