import { defineStore } from 'pinia'
import { silentLoginWithWechat, persistAuth } from '@/utils/request'
import { getMe, updateProfile } from '@/api/auth'
import { uploadImage } from '@/api/upload'

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
    /** 已设置过头像（微信 chooseAvatar 上传后） */
    hasWechatAvatar: (s) => !!s.user?.avatar,
    displayName: (s) => s.user?.realName || s.user?.nickname || '微信用户',
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
    /** 上传微信临时头像并保存 */
    async saveWechatAvatar(tempFilePath) {
      if (!tempFilePath) return null
      if (!this.token) {
        await this.silentLogin()
      }
      const url = await uploadImage(tempFilePath)
      const res = await updateProfile({ avatar: url })
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
