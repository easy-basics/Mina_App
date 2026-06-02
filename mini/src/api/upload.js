import { API_BASE } from '@/config'
import { getToken } from '@/utils/request'

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
        let body
        try {
          body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        } catch {
          reject(new Error('上传失败'))
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
        uni.showToast({ title: '上传失败', icon: 'none' })
        reject(err)
      },
    })
  })
}
