<template>
  <view class="tab-bar">
    <view class="tab-item" :class="{ active: active === 'theme' }" @click="goTheme">
      <image class="tab-icon" :src="tabThemeIcon" mode="aspectFit" />
      <text class="tab-text">主题</text>
    </view>
    <view class="tab-item" :class="{ active: active === 'catalog' }" @click="goCatalog">
      <image class="tab-icon" :src="tabGridIcon" mode="aspectFit" />
      <text class="tab-text">全部商品</text>
    </view>
  </view>
</template>

<script setup>
import tabThemeIcon from '../../assets/svg/tab-theme.svg'
import tabGridIcon from '../../assets/svg/tab-grid.svg'

defineProps({
  active: {
    type: String,
    default: 'theme',
    validator: (v) => ['theme', 'catalog'].includes(v),
  },
})

function goTheme() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  if (current?.route === 'pages/theme/index') return
  uni.redirectTo({ url: '/pages/theme/index' })
}

function goCatalog() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  if (current?.route === 'pages/index') return
  uni.redirectTo({ url: '/pages/index' })
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  height: 100rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-top: 1rpx solid #eee;
  box-sizing: content-box;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  color: #999;
}

.tab-item.active {
  color: var(--color-primary, #ff6633);
}

.tab-icon {
  width: 40rpx;
  height: 40rpx;
  opacity: 0.55;
}

.tab-item.active .tab-icon {
  opacity: 1;
  filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(346deg) brightness(101%) contrast(101%);
}

.tab-text {
  font-size: 22rpx;
  color: inherit;
}
</style>
