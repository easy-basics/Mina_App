/** 微信小程序隐私授权：未响应时 getPhoneNumber / chooseAddress 等不会弹窗 */
export function setupWechatPrivacyListener() {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.onNeedPrivacyAuthorization) {
    wx.onNeedPrivacyAuthorization((resolve) => {
      uni.showModal({
        title: '用户隐私保护提示',
        content:
          '请阅读并同意《用户隐私保护指引》，以便使用手机号、收货地址等相关功能。',
        confirmText: '同意',
        cancelText: '拒绝',
        success(res) {
          resolve({
            event: res.confirm ? 'agree' : 'disagree',
            buttonId: 'privacy-agree-btn',
          })
        },
        fail() {
          resolve({ event: 'disagree' })
        },
      })
    })
  }
  // #endif
}
