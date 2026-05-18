import { API_BASE } from '@/config'

function getToken() {
  return uni.getStorageSync('token') || ''
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
            uni.removeStorageSync('token')
            uni.removeStorageSync('user')
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

export function ensureLogin() {
  if (!getToken()) {
    uni.showModal({
      title: '提示',
      content: '请先登录',
      success(res) {
        if (res.confirm) {
          loginWithWechat()
        }
      },
    })
    return false
  }
  return true
}

export async function loginWithWechat() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async (loginRes) => {
        try {
          const body = await request({
            url: '/mini/auth/wechat',
            method: 'POST',
            data: { code: loginRes.code },
            auth: false,
          })
          uni.setStorageSync('token', body.data.token)
          uni.setStorageSync('user', JSON.stringify(body.data.user))
          resolve(body.data)
        } catch (e) {
          reject(e)
        }
      },
      fail: reject,
    })
  })
}
