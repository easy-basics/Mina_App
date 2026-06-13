<template>
  <view class="page">
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
          v-if="needPrivacyTip"
          id="privacy-agree-btn-mine"
          class="login-btn-bar"
          open-type="agreePrivacyAuthorization"
          hover-class="login-btn-bar--hover"
          @agreeprivacyauthorization="onAgreePrivacy"
        >
          登录
        </button>
        <button
          v-else
          id="privacy-avatar-btn-mine"
          class="login-btn-bar"
          open-type="chooseAvatar"
          hover-class="login-btn-bar--hover"
          :disabled="avatarSaving"
          @chooseavatar="onChooseAvatar"
        >
          {{ loginBtnText }}
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <button class="login-btn-bar" :disabled="avatarSaving" @click="onAvatarUnsupported">
          登录
        </button>
        <!-- #endif -->
      </view>
    </view>

    <view class="menu-group">
      <MineCell title="我的订单" @click="go('/pages/order/list')">
        <template #icon>
          <image class="menu-icon" :src="orderIcon" mode="aspectFit" />
        </template>
      </MineCell>
      <MineCell title="我的收藏" @click="go('/pages/favorite/list')">
        <template #icon>
          <image class="menu-icon" :src="userFavoriteIcon" mode="aspectFit" />
        </template>
      </MineCell>
      <MineCell title="购物车" @click="go('/pages/cart/index')">
        <template #icon>
          <image class="menu-icon" :src="shoppingCartIcon" mode="aspectFit" />
        </template>
      </MineCell>
    </view>

    <view class="menu-group">
      <MineCell title="个人资料" @click="go('/pages/profile/edit')">
        <template #icon>
          <image class="menu-icon" :src="userIcon" mode="aspectFit" />
        </template>
      </MineCell>
      <MineCell title="地址管理" @click="go('/pages/address/list')">
        <template #icon>
          <image class="menu-icon" :src="mapIcon" mode="aspectFit" />
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
import { useWechatAvatar } from '@/composables/useWechatAvatar'
import MineCell from '@/components/MineCell.vue'
import userFavoriteIcon from '../../../assets/svg/user-favorite.svg'
import shoppingCartIcon from '../../../assets/svg/shoppingCart.svg'
import orderIcon from '../../../assets/svg/order.svg'
import userIcon from '../../../assets/svg/user.svg'
import mapIcon from '../../../assets/svg/map.svg'

const userStore = useUserStore()

const {
  avatarSaving,
  needPrivacyTip,
  avatarSrc,
  onChooseAvatar,
  onAgreePrivacy,
  refreshPrivacyTip,
} = useWechatAvatar({
  successToast: null,
  resolveSuccessToast: (hadAvatar) => (hadAvatar ? null : '登录成功'),
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
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 48rpx;
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
  width: 100%;
  display: flex;
  justify-content: center;
}
.login-btn-bar {
  width: 40%;
  height: 88rpx;
  line-height: 88rpx;
  margin: 0;
  padding: 0;
  background: var(--color-primary);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 44rpx;
  border: none;
}
.login-btn-bar::after {
  border: none;
}
.login-btn-bar--hover {
  opacity: 0.88;
}
.login-btn-bar[disabled] {
  opacity: 0.6;
  color: #fff;
  background: var(--color-primary);
}
.menu-group {
  background: #fff;
  margin: 0 0 24rpx;
  overflow: hidden;
}
.menu-group :deep(.mine-cell:not(:last-child)) {
  border-bottom: 1rpx solid #f0f0f0;
}
.menu-icon {
  width: 40rpx;
  height: 40rpx;
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
