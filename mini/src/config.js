// API 地址由 Vite 环境变量注入：
// - dev（npm run dev）：.env.development
// - build（npm run build）：.env.production
// 真机调试可将 .env.development 改为局域网 IP，如 http://192.168.1.100:3000/api
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api'

export const THEME_COLOR = '#ff6633'

/** 小程序技术支持方（页脚等统一展示） */
export const TECH_SUPPORT_VENDOR = '粤企网络'
export const TECH_SUPPORT_TEXT = `${TECH_SUPPORT_VENDOR}技术支持`

/** 用户未授权头像时的默认图 */
export const DEFAULT_AVATAR = '/static/logo.svg'
