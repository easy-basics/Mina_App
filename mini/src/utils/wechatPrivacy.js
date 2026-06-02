/** 与 open-type 含 agreePrivacyAuthorization 的按钮 id 对应 */
export const PRIVACY_BTN_PHONE = 'privacy-agree-btn'
export const PRIVACY_BTN_AVATAR = 'privacy-avatar-btn'

export function onAgreePrivacyAuthorization(e) {
  const errMsg = e?.detail?.errMsg || ''
  if (errMsg && errMsg !== 'agreePrivacyAuthorization:ok') {
    uni.showToast({ title: '需同意隐私协议后才能继续', icon: 'none' })
  }
}

/** 是否仍需用户同意《用户隐私保护指引》（后台已配置且用户未同意时为 true） */
export function getPrivacyNeedAuthorization() {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    if (typeof wx === 'undefined' || !wx.getPrivacySetting) {
      resolve(false)
      return
    }
    wx.getPrivacySetting({
      success: (res) => resolve(!!res.needAuthorization),
      fail: () => resolve(false),
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve(false)
    // #endif
  })
}

/** 打开公众平台配置的《用户隐私保护指引》全文 */
export function openPrivacyContract() {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.openPrivacyContract) {
    wx.openPrivacyContract({})
  }
  // #endif
}

/** getPhoneNumber / chooseAvatar 报 not declared in privacy agreement (errno 112) */
export function showPrivacyNotDeclaredHelp(apiName = '该功能') {
  uni.showModal({
    title: '隐私指引未生效',
    content:
      `${apiName}需要在微信公众平台声明并审核通过：\n` +
      '1. 设置 → 服务内容声明 → 用户隐私保护指引 → 更新\n' +
      '2. 勾选「手机号」「收货地址」及「收集你选中的照片或视频信息」（头像）\n' +
      '3. 保存后等待审核通过（约 5 分钟～1 个工作日）\n' +
      '4. 开发者工具：清缓存 → 清除授权数据，再重试\n' +
      '注：个人主体小程序不支持 getPhoneNumber。',
    confirmText: '查看指引',
    cancelText: '知道了',
    success: (res) => {
      if (res.confirm) openPrivacyContract()
    },
  })
}

/**
 * 不注册 onNeedPrivacyAuthorization 自定义弹窗。
 * 自定义 modal 的「同意」无法满足微信对 agreePrivacyAuthorization 按钮的校验，
 * 会导致 getPhoneNumber / chooseAvatar 仍报 privacy 错误。
 * 使用官方隐私弹窗 + 页面上 open-type 含 agreePrivacyAuthorization 的按钮即可。
 */
export function setupWechatPrivacyListener() {
  /*  intentionally empty */
}
