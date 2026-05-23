<template>
  <view class="page">
    <view class="user-section">
      <view v-if="userStore.hasWechatProfile" class="user-info">
        <view class="user-main">
          <image
            v-if="userStore.mineAvatar"
            class="avatar"
            :src="userStore.mineAvatar"
            mode="aspectFill"
          />
          <view v-else class="avatar avatar--empty" />
          <text class="nickname">{{ userStore.mineNickname }}</text>
        </view>
        <button
          class="update-btn"
          :loading="authorizing"
          @click.stop="doAuthorize"
        >
          更新
        </button>
      </view>
      <view v-else class="login-wrap">
        <button class="login-btn" :loading="authorizing" @click.stop="doAuthorize">
          微信登录
        </button>
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
      <MineCell title="联系地址" @click="pickAddress">
        <template #icon>
          <view class="icon-location" />
        </template>
      </MineCell>
    </view>

    <view v-if="userStore.isLoggedIn" class="sub-link" @click="go('/pages/address/list')">
      管理收货地址
    </view>

    <view class="footer">
      <view class="footer-line" />
      <text class="footer-text">{{ TECH_SUPPORT_TEXT }}</text>
      <view class="footer-line" />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { ensureLogin } from '@/utils/request'
import { chooseAndImportAddress } from '@/utils/wechatAddress'
import { TECH_SUPPORT_TEXT } from '@/config'
import MineCell from '@/components/MineCell.vue'

const userStore = useUserStore()
const authorizing = ref(false)

async function doAuthorize() {
  if (!userStore.isLoggedIn) return
  authorizing.value = true
  try {
    await userStore.authorizeProfile()
  } catch {
    /* request / getUserProfile 已提示 */
  } finally {
    authorizing.value = false
  }
}

function go(url) {
  if (!ensureLogin()) return
  uni.navigateTo({ url })
}

async function pickAddress() {
  if (!ensureLogin()) return
  try {
    await chooseAndImportAddress()
    uni.showToast({ title: '已同步收货地址' })
  } catch (e) {
    if (e?.message === 'cancel') return
  }
}

onShow(async () => {
  if (!userStore.isLoggedIn) {
    try {
      await userStore.silentLogin()
    } catch {
      return
    }
  }
  try {
    await userStore.fetchProfile()
  } catch {
    /* ignore */
  }
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
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.avatar--empty {
  background: #f0f0f0;
}
.nickname {
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
.update-btn {
  flex-shrink: 0;
  margin: 0 0 0 24rpx;
  padding: 0 24rpx;
  height: 56rpx;
  line-height: 56rpx;
  font-size: 28rpx;
  color: var(--color-primary);
  background: transparent;
  border: none;
}
.update-btn::after {
  border: none;
}
.login-wrap {
  display: flex;
  justify-content: center;
}
.login-btn {
  background: #fff;
  color: var(--color-primary);
  border: 2rpx solid var(--color-primary);
  border-radius: 40rpx;
  padding: 0 64rpx;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 30rpx;
}
.login-btn::after {
  border: none;
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
.sub-link {
  text-align: center;
  font-size: 26rpx;
  color: #999;
  padding: 16rpx;
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
