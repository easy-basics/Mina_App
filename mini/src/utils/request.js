import { API_BASE, DEFAULT_AVATAR } from '@/config'

function getToken() {
  return uni.getStorageSync('token') || ''
}

function persistAuth(token, user) {
  if (token !== undefined) {
    if (token) uni.setStorageSync('token', token)
    else uni.removeStorageSync('token')
  }
  if (user !== undefined) {
    if (user) uni.setStorageSync('user', JSON.stringify(user))
    else uni.removeStorageSync('user')
  }
}

export function request(options) {
  const { url, method = 'GET', data, auth = true } = options

  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    if (auth) {
      const token = getToken()
      if (token) header.Authorization = `Bearer ${token}`
    }

    uni.request({
      url: API_BASE + url,
      method,
      data,
      header,
      timeout: 15000,
      success(res) {
        const body = res.data
        if (body.code !== 0) {
          if (res.statusCode === 401 || body.code === 401) {
            persistAuth('', null)
            uni.showToast({ title: body.message || '请重新登录', icon: 'none' })
          } else {
            uni.showToast({ title: body.message || '请求失败', icon: 'none' })
          }
          reject(new Error(body.message || '请求失败'))
          return
        }
        resolve(body)
      },
      fail(err) {
        uni.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      },
    })
  })
}

/** wx.login → code → token；可选携带 avatar（chooseAvatar 登录时） */
export function silentLoginWithWechat(profile) {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async (loginRes) => {
        try {
          const data = { code: loginRes.code }
          if (profile?.avatar !== undefined) {
            data.avatar = profile.avatar
          }
          const body = await request({
            url: '/mini/auth/wechat',
            method: 'POST',
            data,
            auth: false,
          })
          persistAuth(body.data.token, body.data.user)
          resolve(body.data)
        } catch (e) {
          reject(e)
        }
      },
      fail: reject,
    })
  })
}

export function ensureLogin() {
  if (!getToken()) {
    uni.showToast({ title: '正在登录，请稍后重试', icon: 'none' })
    return false
  }
  return true
}

export { DEFAULT_AVATAR, getToken, persistAuth }
