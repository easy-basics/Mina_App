/** 从 VITE_ASSET_BASE_URL 或 VITE_API_BASE_URL 推导静态资源域名 */
export function getAssetOrigin() {
  const fromAsset = import.meta.env.VITE_ASSET_BASE_URL?.trim()
  if (fromAsset) {
    return fromAsset.replace(/\/+$/, '')
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/\/api\/?$/, '')
  }
  return ''
}

function toUploadsPath(url) {
  if (!url) return ''
  if (url.startsWith('/uploads/')) return url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url)
      if (u.pathname.startsWith('/uploads/')) return u.pathname
    } catch {
      /* ignore */
    }
  }
  return ''
}

/** /uploads/... 统一用相对路径（dev/preview 走 Vite 代理，生产走 nginx 反代） */
export function resolveMediaUrl(url) {
  if (!url) return ''

  const uploadsPath = toUploadsPath(url)
  if (uploadsPath) {
    return uploadsPath
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return url.startsWith('/') ? url : `/${url}`
}

/** 入库/提交用：统一存相对路径 */
export function toStoredMediaPath(url) {
  if (!url) return ''
  if (url.startsWith('/uploads/')) return url
  try {
    const u = new URL(url)
    if (u.pathname.startsWith('/uploads/')) return u.pathname
  } catch {
    /* ignore */
  }
  return url
}
