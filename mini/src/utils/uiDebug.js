/** 开发环境 UI 调试（VITE_UI_DEBUG=false 可关闭） */
export function isUiDebugEnabled() {
  if (!import.meta.env.DEV) return false
  return import.meta.env.VITE_UI_DEBUG !== 'false'
}

export function setupUiDebug() {
  if (!isUiDebugEnabled()) return

  try {
    const { uniPlatform } = uni.getSystemInfoSync()
    if (uniPlatform === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.add('ui-debug')
    }
    if (uniPlatform === 'mp-weixin' && typeof wx !== 'undefined' && wx.setEnableDebug) {
      wx.setEnableDebug({ enableDebug: true })
    }
  } catch {
    /* ignore */
  }

  console.info('[UI Debug] enabled')
}
