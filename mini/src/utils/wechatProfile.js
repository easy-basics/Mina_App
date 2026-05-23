import { generateRandomNickname } from '@/utils/randomNickname'

/** 用户点击授权时请求微信头像昵称；拒绝或非微信环境返回空白头像 + 随机昵称 */
export function requestWechatProfile() {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.getUserProfile({
      desc: '用于展示您的头像和昵称',
      success: (res) => {
        resolve({
          granted: true,
          nickname: res.userInfo.nickName || generateRandomNickname(),
          avatar: res.userInfo.avatarUrl || null,
        })
      },
      fail: () => {
        resolve({
          granted: false,
          nickname: generateRandomNickname(),
          avatar: null,
        })
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve({
      granted: false,
      nickname: generateRandomNickname(),
      avatar: null,
    })
    // #endif
  })
}
