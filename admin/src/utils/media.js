/** 从 VITE_API_BASE_URL 推导静态资源域名（去掉 /api） */
export function getAssetOrigin() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/\/api\/?$/, '')
  }
  return ''
}

/** 相对路径 /uploads/... → 可访问的绝对地址（仅用于展示） */
export function resolveMediaUrl(url) {
  if (!url) return ''
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
