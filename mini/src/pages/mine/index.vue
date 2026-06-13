<template>
  <view class="page">
    <!-- #ifdef MP-WEIXIN -->
    <view v-if="needPrivacyTip" class="privacy-tip">
      <text class="privacy-tip-text">登录前需同意</text>
      <text class="privacy-link" @click="openPrivacyContract">《用户隐私保护指引》</text>
      <text class="privacy-tip-text">，请点击下方「登录」并在微信弹窗中选择同意。</text>
    </view>
    <!-- #endif -->

    <view class="user-section">
      <view v-if="userStore.hasWechatAvatar" class="user-info">
        <view class="user-main">
          <!-- #ifdef MP-WEIXIN -->
          <button
            id="privacy-avatar-btn"
            class="avatar-picker"
            open-type="chooseAvatar|agreePrivacyAuthorization"
            hover-class="none"
            :disabled="avatarSaving"
            @chooseavatar="onChooseAvatar"
            @agreeprivacyauthorization="onAgreePrivacy"
          >
            <image class="avatar" :src="avatarSrc" mode="aspectFill" />
          </button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <image class="avatar" :src="avatarSrc" mode="aspectFill" />
          <!-- #endif -->
          <text
            v-if="userStore.hasRegisteredProfile"
            class="real-name"
          >{{ userStore.mineRealName }}</text>
        </view>
        <text
          v-if="!userStore.hasRegisteredProfile"
          class="profile-link"
          @click="go('/pages/profile/edit')"
        >个人资料</text>
      </view>
      <view v-else class="login-wrap">
        <!-- #ifdef MP-WEIXIN -->
        <button
          id="privacy-avatar-btn"
          class="login-btn"
          open-type="chooseAvatar|agreePrivacyAuthorization"
          hover-class="none"
          :disabled="avatarSaving"
          @chooseavatar="onChooseAvatar"
          @agreeprivacyauthorization="onAgreePrivacy"
        >
          <view class="login-avatar login-avatar--placeholder" />
          <text class="login-text">{{ loginBtnText }}</text>
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <button class="login-btn" :disabled="avatarSaving" @click="onAvatarUnsupported">
          登录
        </button>
        <!-- #endif -->
      </view>
    </view>

    <view class="menu-group">
      <MineCell title="我的订单" @click="go('/pages/order/list')">
        <template #icon>
          <view class="icon-order" />
        </template>
      </MineCell>
      <MineCell title="我的收藏" @click="go('/pages/favorite/list')">
        <template #icon>
          <view class="icon-star" />
        </template>
      </MineCell>
    </view>

    <view class="menu-group">
      <MineCell title="个人资料" @click="go('/pages/profile/edit')">
        <template #icon>
          <view class="icon-profile" />
        </template>
      </MineCell>
      <MineCell title="管理收货地址" @click="go('/pages/address/list')">
        <template #icon>
          <view class="icon-location" />
        </template>
      </MineCell>
    </view>

    <view class="footer">
      <view class="footer-line" />
      <text class="footer-text">{{ TECH_SUPPORT_TEXT }}</text>
      <view class="footer-line" />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { ensureLogin } from '@/utils/request'
import { TECH_SUPPORT_TEXT } from '@/config'
import { getPrivacyNeedAuthorization } from '@/utils/wechatPrivacy'
import { useWechatAvatar } from '@/composables/useWechatAvatar'
import MineCell from '@/components/MineCell.vue'

const userStore = useUserStore()

const {
  avatarSaving,
  needPrivacyTip,
  avatarSrc,
  onChooseAvatar,
  onAgreePrivacy,
  refreshPrivacyTip,
  openPrivacyContract,
} = useWechatAvatar({
  successToast: null,
  resolveSuccessToast: (hadAvatar) => (hadAvatar ? null : '登录成功'),
  retapAfterPrivacy: '请再次点击登录选择头像',
})

const loginBtnText = computed(() =>
  avatarSaving.value ? '上传中…' : '登录'
)

function onAvatarUnsupported() {
  uni.showToast({ title: '请在微信小程序中使用', icon: 'none' })
}

function go(url) {
  if (!ensureLogin()) return
  uni.navigateTo({ url })
}

/** 若仍待同意隐私协议，先触发官方授权 */
async function ensurePrivacyReady() {
  // #ifdef MP-WEIXIN
  const need = await getPrivacyNeedAuthorization()
  if (need && typeof wx !== 'undefined' && wx.requirePrivacyAuthorize) {
    await new Promise((resolve) => {
      wx.requirePrivacyAuthorize({
        success: () => resolve(),
        fail: () => resolve(),
      })
    })
  }
  // #endif
}

onShow(async () => {
  if (!userStore.isLoggedIn) {
    try {
      await userStore.silentLogin()
    } catch {
      uni.showToast({ title: '登录失败，请检查网络后重试', icon: 'none' })
    }
  }
  try {
    await userStore.fetchProfile()
  } catch {
    /* ignore */
  }
  await refreshPrivacyTip()
  await ensurePrivacyReady()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 48rpx;
}
.privacy-tip {
  margin: 16rpx 24rpx 0;
  padding: 20rpx 24rpx;
  background: #fff8f0;
  border-radius: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #666;
}
.privacy-tip-text {
  color: #666;
}
.privacy-link {
  color: var(--color-primary);
}
.user-section {
  background: #fff;
  padding: 48rpx 32rpx;
  margin-bottom: 24rpx;
}
.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.user-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.real-name {
  margin-left: 28rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: #2d2a3e;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-link {
  flex-shrink: 0;
  margin-left: 24rpx;
  font-size: 28rpx;
  color: var(--color-primary);
}
.avatar-picker {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  line-height: 1;
}
.avatar-picker::after {
  border: none;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: #f0f0f0;
  display: block;
}
.login-wrap {
  display: flex;
  justify-content: center;
}
.login-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 32rpx 48rpx;
  background: #fff;
  border: 2rpx solid var(--color-primary);
  border-radius: 24rpx;
}
.login-btn::after {
  border: none;
}
.login-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #f0f0f0;
  margin-bottom: 20rpx;
}
.login-avatar--placeholder {
  position: relative;
}
.login-avatar--placeholder::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48rpx;
  height: 48rpx;
  background: #ccc;
  border-radius: 50%;
}
.login-text {
  font-size: 30rpx;
  color: var(--color-primary);
  line-height: 1.4;
}
.menu-group {
  background: #fff;
  margin: 0 0 24rpx;
  overflow: hidden;
}
.menu-group :deep(.mine-cell:not(:last-child)) {
  border-bottom: 1rpx solid #f0f0f0;
}
.icon-order {
  width: 36rpx;
  height: 44rpx;
  background: #ffb300;
  border-radius: 4rpx;
  position: relative;
}
.icon-order::after {
  content: '';
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  right: 8rpx;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 10rpx 0 rgba(255, 255, 255, 0.8), 0 20rpx 0 rgba(255, 255, 255, 0.8);
}
.icon-star {
  width: 40rpx;
  height: 40rpx;
  background: #e53935;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}
.icon-profile {
  width: 36rpx;
  height: 36rpx;
  background: #26a69a;
  border-radius: 50%;
  position: relative;
}
.icon-profile::after {
  content: '';
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 24rpx;
  background: #26a69a;
  border-radius: 24rpx 24rpx 0 0;
}
.icon-location {
  width: 32rpx;
  height: 44rpx;
  background: #2196f3;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  margin-left: 4rpx;
}
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 48rpx 0;
  gap: 24rpx;
}
.footer-line {
  flex: 1;
  height: 1rpx;
  background: #e0e0e0;
  max-width: 120rpx;
}
.footer-text {
  font-size: 24rpx;
  color: #bbb;
  white-space: nowrap;
}
</style>
