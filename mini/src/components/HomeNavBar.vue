<template>
  <view class="nav-bar" :style="{ paddingTop: metrics.statusBarHeight + 'px' }">
    <view class="nav-inner" :style="{ height: metrics.navBarHeight + 'px', paddingRight: metrics.capsuleRight + 'px' }">
      <view class="nav-left">
        <view class="nav-pill">
          <view class="pill-btn" @click="emit('home')">
            <image class="pill-icon" src="/static/icons/nav-home-light.svg" mode="aspectFit" />
          </view>
          <view class="pill-divider" />
          <view class="pill-btn" @click="emit('search')">
            <image class="pill-icon" src="/static/icons/nav-search-light.svg" mode="aspectFit" />
          </view>
        </view>
      </view>
      <text class="nav-title">{{ title }}</text>
    </view>
  </view>
  <view class="nav-placeholder" :style="{ height: metrics.totalHeight + 'px' }" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getNavBarMetrics } from '@/utils/navbar'

defineProps({
  title: { type: String, default: '品牌首页' },
})

const emit = defineEmits(['home', 'search'])

const metrics = ref(getNavBarMetrics())

onMounted(() => {
  metrics.value = getNavBarMetrics()
})

defineExpose({ metrics })
</script>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--color-primary);
}

.nav-inner {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 24rpx;
  box-sizing: border-box;
}

.nav-left {
  flex-shrink: 0;
}

.nav-pill {
  display: flex;
  align-items: center;
  height: 64rpx;
  padding: 0 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.25);
  border-radius: 32rpx;
  background: rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.pill-btn {
  width: 72rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-divider {
  width: 1rpx;
  height: 32rpx;
  background: rgba(255, 255, 255, 0.25);
}

.pill-icon {
  width: 52rpx;
  height: 52rpx;
  display: block;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 34rpx;
  font-weight: 600;
  color: #fff;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-placeholder {
  width: 100%;
  flex-shrink: 0;
  background: var(--color-primary);
  margin: 0;
  padding: 0;
}
</style>
