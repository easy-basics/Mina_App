import { generateRandomNickname } from '@/utils/randomNickname'

/** 用户点击登录时请求微信头像昵称；拒绝或非微信环境则返回默认资料 */
export function requestWechatProfile() {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.getUserProfile({
      desc: '用于展示您的头像和昵称',
      success: (res) => {
        resolve({
          nickname: res.userInfo.nickName || generateRandomNickname(),
          avatar: res.userInfo.avatarUrl || null,
        })
      },
      fail: () => {
        resolve({
          nickname: generateRandomNickname(),
          avatar: null,
        })
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve({
      nickname: generateRandomNickname(),
      avatar: null,
    })
    // #endif
  })
}
