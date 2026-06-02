/** 与 open-type 含 agreePrivacyAuthorization 的按钮 id 对应 */
export const PRIVACY_BTN_PHONE = 'privacy-agree-btn'
export const PRIVACY_BTN_AVATAR = 'privacy-avatar-btn'

export function onAgreePrivacyAuthorization(e) {
  const errMsg = e?.detail?.errMsg || ''
  if (errMsg && errMsg !== 'agreePrivacyAuthorization:ok') {
    uni.showToast({ title: '需同意隐私协议后才能继续', icon: 'none' })
  }
}

/** 微信小程序隐私授权：未响应时 chooseAvatar / getPhoneNumber / chooseAddress 等会报错 */
export function setupWechatPrivacyListener() {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.onNeedPrivacyAuthorization) {
    wx.onNeedPrivacyAuthorization((resolve, eventInfo) => {
      const referrer = eventInfo?.referrer || ''
      const buttonId = referrer.includes('chooseAvatar')
        ? PRIVACY_BTN_AVATAR
        : PRIVACY_BTN_PHONE
      uni.showModal({
        title: '用户隐私保护提示',
        content:
          '请阅读并同意《用户隐私保护指引》，以便使用头像、手机号、收货地址等相关功能。',
        confirmText: '同意',
        cancelText: '拒绝',
        success(res) {
          resolve({
            event: res.confirm ? 'agree' : 'disagree',
            buttonId,
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
