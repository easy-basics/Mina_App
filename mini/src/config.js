// API 地址由 Vite 环境变量注入：
// - dev（npm run dev）：.env.development
// - build（npm run build）：.env.production
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'

/**
 * 图片/上传文件 CDN 根地址（不含 /api）
 * 优先 VITE_ASSET_BASE_URL，否则从 VITE_API_BASE_URL 推导
 * 生产构建请配置为 https://api.mina.bigdeng.com
 */
function resolveAssetBase() {
  const fromEnv = import.meta.env.VITE_ASSET_BASE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '')
  }
  const fromApi = (import.meta.env.VITE_API_BASE_URL || '')
    .replace(/\/api\/?$/i, '')
    .replace(/\/+$/, '')
  if (fromApi) return fromApi
  return 'http://127.0.0.1:3000'
}

export const ASSET_BASE_URL = resolveAssetBase()

export const THEME_COLOR = '#ff6633'

/** 小程序技术支持方（页脚等统一展示） */
export const TECH_SUPPORT_VENDOR = '粤企网络'
export const TECH_SUPPORT_TEXT = `${TECH_SUPPORT_VENDOR}技术支持`

/** 用户未授权头像时的默认图 */
export const DEFAULT_AVATAR = '/static/logo.svg'
