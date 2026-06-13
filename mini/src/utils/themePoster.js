import { getCategoryWxacode } from '@/api/catalog'
import { resolveImageUrl } from '@/utils/media'

const POSTER_WIDTH = 750
const FOOTER_HEIGHT = 56
const BOTTOM_SECTION_HEIGHT = 240
const QR_SIZE = 180
const FOOTER_TEXT = '粤企网络技术支持'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('图片地址为空'))
      return
    }
    uni.getImageInfo({
      src,
      success: resolve,
      fail: reject,
    })
  })
}

function writeBase64ToTemp(base64DataUrl) {
  return new Promise((resolve, reject) => {
    const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '')
    const dir = typeof wx !== 'undefined' && wx.env?.USER_DATA_PATH
      ? wx.env.USER_DATA_PATH
      : ''
    if (!dir) {
      resolve(base64DataUrl)
      return
    }
    const filePath = `${dir}/theme-qrcode-${Date.now()}.png`
    uni.getFileSystemManager().writeFile({
      filePath,
      data: base64,
      encoding: 'base64',
      success: () => resolve(filePath),
      fail: reject,
    })
  })
}

function getCanvasNode(canvasId, instance) {
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery().in(instance)
    query
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        const node = res?.[0]?.node
        if (!node) {
          reject(new Error('Canvas 未就绪'))
          return
        }
        resolve(node)
      })
  })
}

function canvasToTempFile(canvas, width, height) {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvas,
      width,
      height,
      destWidth: width,
      destHeight: height,
      fileType: 'png',
      success: (res) => resolve(res.tempFilePath),
      fail: reject,
    })
  })
}

/**
 * 绘制主题海报并导出临时图片路径
 */
export async function generateThemePoster({ theme, canvasId, instance }) {
  const coverSrc = resolveImageUrl(theme.coverImage, '/static/logo.svg')
  const wxRes = await getCategoryWxacode(theme.id)
  const qrcodeSrc = await writeBase64ToTemp(wxRes.data.qrcode)

  const [coverInfo, qrInfo] = await Promise.all([
    loadImage(coverSrc),
    loadImage(qrcodeSrc),
  ])

  const coverHeight = Math.round((coverInfo.height / coverInfo.width) * POSTER_WIDTH)
  const posterHeight = coverHeight + BOTTOM_SECTION_HEIGHT + FOOTER_HEIGHT

  const canvas = await getCanvasNode(canvasId, instance)
  const ctx = canvas.getContext('2d')
  const dpr = uni.getSystemInfoSync().pixelRatio || 2

  canvas.width = POSTER_WIDTH * dpr
  canvas.height = posterHeight * dpr
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, POSTER_WIDTH, posterHeight)

  const coverImg = canvas.createImage()
  await new Promise((resolve, reject) => {
    coverImg.onload = resolve
    coverImg.onerror = reject
    coverImg.src = coverInfo.path
  })
  ctx.drawImage(coverImg, 0, 0, POSTER_WIDTH, coverHeight)

  const bottomY = coverHeight
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, bottomY, POSTER_WIDTH, BOTTOM_SECTION_HEIGHT + FOOTER_HEIGHT)

  const qrImg = canvas.createImage()
  await new Promise((resolve, reject) => {
    qrImg.onload = resolve
    qrImg.onerror = reject
    qrImg.src = qrInfo.path
  })

  const qrX = 40
  const qrY = bottomY + (BOTTOM_SECTION_HEIGHT - QR_SIZE) / 2
  ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE)

  const textX = qrX + QR_SIZE + 32
  const textCenterY = bottomY + BOTTOM_SECTION_HEIGHT / 2

  ctx.fillStyle = '#333333'
  ctx.font = 'bold 36px sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(theme.name || '系列主题', textX, textCenterY - 24)

  ctx.fillStyle = '#999999'
  ctx.font = '26px sans-serif'
  ctx.fillText('扫码查看更多信息', textX, textCenterY + 24)

  const footerY = bottomY + BOTTOM_SECTION_HEIGHT
  ctx.strokeStyle = '#eeeeee'
  ctx.beginPath()
  ctx.moveTo(40, footerY)
  ctx.lineTo(POSTER_WIDTH - 40, footerY)
  ctx.stroke()

  ctx.fillStyle = '#bbbbbb'
  ctx.font = '22px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(FOOTER_TEXT, POSTER_WIDTH / 2, footerY + FOOTER_HEIGHT / 2)

  return canvasToTempFile(canvas, POSTER_WIDTH * dpr, posterHeight * dpr)
}

export function savePosterToAlbum(filePath) {
  const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

  if (isH5) {
    return new Promise((resolve, reject) => {
      try {
        const link = document.createElement('a')
        link.href = filePath
        link.download = `theme-poster-${Date.now()}.png`
        link.click()
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }

  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: (err) => {
        if (err.errMsg?.includes('auth deny') || err.errMsg?.includes('authorize')) {
          uni.showModal({
            title: '提示',
            content: '需要相册权限才能保存海报',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) uni.openSetting()
            },
          })
        }
        reject(err)
      },
    })
  })
}
