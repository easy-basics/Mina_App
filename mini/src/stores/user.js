import { defineStore } from 'pinia'
import { silentLoginWithWechat, persistAuth } from '@/utils/request'
import { isH5DevAutoLoginEnabled } from '@/utils/devAuth'
import { getMe, updateProfile } from '@/api/auth'

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
    /** 已有后端会话（App 启动静默 wx.login 换取 token） */
    isLoggedIn: (s) => !!s.token,
    /** 已完成头像授权（我的页 UI 门槛；chooseAvatar 保存微信 CDN 地址后） */
    hasWechatAvatar: (s) => !!s.user?.avatar,
    /** 我的页需引导用户选择头像（与 hasWechatAvatar 互斥） */
    needsAvatarLogin: (s) => !s.user?.avatar,
    /** 姓名、手机号、公司名均已填写（与个人资料页保存校验一致） */
    hasRegisteredProfile: (s) => {
      const u = s.user
      if (!u) return false
      const name = u.realName?.trim()
      const phone = u.phone?.trim()
      const company = u.companyName?.trim()
      return !!(name && /^1\d{10}$/.test(phone) && company)
    },
    displayName: (s) => s.user?.realName || s.user?.nickname || '微信用户',
    mineAvatar: (s) => s.user?.avatar || '',
    mineRealName: (s) => s.user?.realName?.trim() || '',
  },
  actions: {
    /** 启动静默登录：仅换取 token */
    async silentLogin() {
      const data = await silentLoginWithWechat()
      this.token = data.token
      this.user = data.user
      this.authReady = true
      persistUser(data.user)
      await this.ensureDevMockProfile()
      return data
    },
    /** H5 开发环境补全模拟用户资料，跳过「我的」页登录态 */
    async ensureDevMockProfile() {
      if (!isH5DevAutoLoginEnabled()) return this.user

      const u = this.user
      const patch = {}
      if (!u?.avatar) {
        patch.avatar = import.meta.env.VITE_DEV_MOCK_AVATAR || '/static/logo.svg'
      }
      if (!u?.realName?.trim()) {
        patch.realName = import.meta.env.VITE_DEV_MOCK_REAL_NAME || '开发用户'
      }
      if (!u?.phone?.trim()) {
        patch.phone = import.meta.env.VITE_DEV_MOCK_PHONE || '13800000000'
      }
      if (!u?.companyName?.trim()) {
        patch.companyName = import.meta.env.VITE_DEV_MOCK_COMPANY || '开发公司'
      }

      if (!Object.keys(patch).length) return u

      const res = await updateProfile(patch)
      this.user = res.data
      persistUser(res.data)
      return res.data
    },
    async fetchProfile() {
      if (!this.token) return null
      const res = await getMe()
      this.user = res.data
      persistUser(res.data)
      return res.data
    },
    /** 保存 chooseAvatar 返回的微信 CDN 头像地址到服务端 */
    async saveWechatAvatar(avatarUrl) {
      const url = avatarUrl?.trim()
      if (!url) return null

      const saveProfile = async () => {
        if (!this.token) {
          await this.silentLogin()
        }
        const res = await updateProfile({ avatar: url })
        this.user = res.data
        persistUser(res.data)
        return res.data
      }

      try {
        return await saveProfile()
      } catch (e) {
        const msg = String(e?.message || '')
        if (msg.includes('请先登录') || msg.includes('登录已过期')) {
          await this.silentLogin()
          return saveProfile()
        }
        throw e
      }
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
