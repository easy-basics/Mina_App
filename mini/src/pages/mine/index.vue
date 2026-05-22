<template>
  <view class="page">
    <view class="header">
      <view v-if="userStore.isLoggedIn" class="user-info">
        <text class="nickname">{{ userStore.user?.nickname || '微信用户' }}</text>
      </view>
      <button v-else class="login-btn" @click="doLogin">微信登录</button>
    </view>
    <view class="menu">
      <view class="menu-item" @click="go('/pages/order/list')">我的订单</view>
      <view class="menu-item" @click="go('/pages/favorite/list')">我的收藏</view>
      <view class="menu-item" @click="go('/pages/address/list')">收货地址</view>
    </view>
    <button v-if="userStore.isLoggedIn" class="logout" @click="logout">退出登录</button>
  </view>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { ensureLogin } from '@/utils/request'

const userStore = useUserStore()

async function doLogin() {
  await userStore.login()
  uni.showToast({ title: '登录成功' })
}

function go(url) {
  if (!ensureLogin()) return
  uni.navigateTo({ url })
}

function logout() {
  userStore.logout()
  uni.showToast({ title: '已退出' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
}
.header {
  background: linear-gradient(135deg, #ff6633, #ff8855);
  padding: 60rpx 32rpx;
  color: #fff;
}
.login-btn {
  background: #fff;
  color: var(--color-primary);
  border-radius: 8rpx;
}
.menu {
  margin: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}
.menu-item {
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 30rpx;
}
.logout {
  margin: 40rpx;
  background: #fff;
  color: #999;
}
</style>
