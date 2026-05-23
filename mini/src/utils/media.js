import { ASSET_BASE_URL } from '@/config'

/**
 * 将接口返回的图片路径转为小程序可加载的绝对 HTTPS 地址
 * 上传图（/uploads/...）统一拼接到 ASSET_BASE_URL，避免接口返回错误域名或 http
 */
export function resolveImageUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') {
    return fallback
  }
  const trimmed = url.trim()
  if (!trimmed) return fallback

  if (trimmed.startsWith('/static/')) {
    return trimmed
  }

  const base = ASSET_BASE_URL.replace(/\/+$/, '')
  if (!base) return fallback

  const uploadsIdx = trimmed.indexOf('/uploads/')
  if (uploadsIdx !== -1) {
    const path = trimmed.slice(uploadsIdx)
    return `${base}${path}`
  }

  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`
  }

  if (/^https?:\/\//i.test(trimmed)) {
    if (import.meta.env.PROD) {
      return trimmed.replace(/^http:\/\//i, 'https://')
    }
    return trimmed
  }

  return `${base}/${trimmed}`
}
