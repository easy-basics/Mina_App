import { ASSET_BASE_URL } from '@/config'

/** 微信 chooseAvatar 本地临时路径，不能当网络 URL 加载或入库 */
export function isWechatLocalTempUrl(url) {
  if (!url || typeof url !== 'string') return false
  const t = url.trim().toLowerCase()
  return (
    t.startsWith('wxfile://') ||
    /^https?:\/\/tmp\//i.test(t) ||
    /^https?:\/\/usr\//i.test(t)
  )
}

/**
 * 将接口返回的图片路径转为小程序可加载的绝对 HTTPS 地址
 * 上传图（/uploads/...）统一拼接到 ASSET_BASE_URL，避免接口返回错误域名或 http
 */
export function resolveImageUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') {
    return fallback
  }
  const trimmed = url.trim()
  if (!trimmed || isWechatLocalTempUrl(trimmed)) return fallback

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

/** 预览图片，支持缩放滑动查看 */
export function previewImages(urls, current = 0) {
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean)
  if (!list.length) return
  const currentUrl = typeof current === 'number' ? list[current] : current
  uni.previewImage({
    urls: list,
    current: currentUrl || list[0],
  })
}
