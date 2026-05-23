import { importAddress } from '@/api/address'

function mapChooseAddress(res) {
  return {
    name: res.userName,
    phone: res.telNumber,
    province: res.provinceName,
    city: res.cityName,
    district: res.countyName,
    detail: res.detailInfo,
  }
}

export function chooseAndImportAddress() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.chooseAddress({
      success: async (res) => {
        try {
          const body = await importAddress(mapChooseAddress(res))
          resolve(body.data)
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        if (err?.errMsg?.includes('cancel')) {
          reject(new Error('cancel'))
          return
        }
        uni.showToast({ title: '获取地址失败', icon: 'none' })
        reject(err)
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    uni.showToast({ title: '请在微信小程序中使用', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/address/list' })
    }, 1500)
    reject(new Error('not mp-weixin'))
    // #endif
  })
}
