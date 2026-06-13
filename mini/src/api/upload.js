import { API_BASE } from '@/config'
import { getToken } from '@/utils/request'

function resolveUploadFailMessage(err, statusCode) {
  const msg = String(err?.errMsg || err?.message || '')
  if (statusCode === 401) return '登录已过期，请重新登录'
  if (statusCode === 413) return '头像文件过大'
  if (/domain|合法域名|url not in|not in domain list/i.test(msg)) {
    return '未配置 uploadFile 合法域名'
  }
  if (/timeout/i.test(msg)) return '上传超时，请检查网络'
  if (/connect|network|abort/i.test(msg)) return '网络异常，请稍后重试'
  // 体验版/正式版未配 uploadFile 时 fail 常无详细 errMsg
  if (import.meta.env.PROD) {
    return '上传失败，请确认已配置 uploadFile 合法域名'
  }
  return '上传失败，请稍后重试'
}

/** 上传图片到 /api/mini/upload，返回相对路径如 /uploads/xxx.jpg */
export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    if (!token) {
      reject(new Error('请先登录'))
      return
    }
    uni.uploadFile({
      url: `${API_BASE}/mini/upload`,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`,
      },
      success(res) {
        const statusCode = res.statusCode || 0
        let body
        try {
          body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        } catch {
          const tip = resolveUploadFailMessage(null, statusCode)
          uni.showToast({ title: tip, icon: 'none' })
          reject(new Error(tip))
          return
        }
        if (statusCode === 401 || body.code === 401) {
          const tip = body.message || '登录已过期，请重新登录'
          uni.showToast({ title: tip, icon: 'none' })
          reject(new Error(tip))
          return
        }
        if (body.code !== 0) {
          uni.showToast({ title: body.message || '上传失败', icon: 'none' })
          reject(new Error(body.message || '上传失败'))
          return
        }
        resolve(body.data.url)
      },
      fail(err) {
        const tip = resolveUploadFailMessage(err)
        uni.showToast({ title: tip, icon: 'none' })
        reject(err)
      },
    })
  })
}
