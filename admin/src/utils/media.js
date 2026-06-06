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

function isLocalHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

/** 相对路径 /uploads/... → 可访问的绝对地址（仅用于展示） */
export function resolveMediaUrl(url) {
  if (!url) return ''

  const uploadsPath = toUploadsPath(url)
  if (uploadsPath && isLocalHost()) {
    // 本地 dev / preview 走 Vite 同源 /uploads 代理，避免跨域加载失败
    return uploadsPath
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    const origin = getAssetOrigin()
    if (origin && url.includes('admin.mina.bigdeng.com')) {
      try {
        const u = new URL(url)
        if (u.pathname.startsWith('/uploads/')) {
          return `${origin}${u.pathname}`
        }
      } catch {
        /* ignore */
      }
    }
    return url
  }

  const origin = getAssetOrigin()
  if (!origin) {
    return url.startsWith('/') ? url : `/${url}`
  }
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`
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
