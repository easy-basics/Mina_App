import { request, persistAuth } from '@/utils/request'

/** H5 本地开发是否启用自动登录（默认开启，VITE_DEV_AUTO_LOGIN=false 可关闭） */
export function isH5DevAutoLoginEnabled() {
  if (!import.meta.env.DEV) return false
  if (import.meta.env.VITE_DEV_AUTO_LOGIN === 'false') return false
  try {
    const { uniPlatform } = uni.getSystemInfoSync()
    return uniPlatform === 'web'
  } catch {
    return false
  }
}

/** H5 开发环境直连 API 换取 token，绕过 uni.login（使用 api/.env 的 WECHAT_DEV_OPENID） */
export async function devSilentLogin(profile) {
  const data = { code: 'dev_h5' }
  if (profile?.avatar !== undefined) {
    data.avatar = profile.avatar
  }
  if (profile?.nickname !== undefined) {
    data.nickname = profile.nickname
  }

  const body = await request({
    url: '/mini/auth/wechat',
    method: 'POST',
    data,
    auth: false,
  })
  persistAuth(body.data.token, body.data.user)
  return body.data
}
