<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <template v-else-if="theme">
      <scroll-view scroll-y class="scroll">
        <view class="header">
          <text class="title">{{ theme.name }}</text>
          <text v-if="theme.subtitle" class="subtitle">{{ theme.subtitle }}</text>
        </view>
        <image
          class="cover"
          :src="resolveImageUrl(theme.coverImage, '/static/logo.svg')"
          mode="widthFix"
        />
        <view class="product-list">
          <view v-for="p in theme.products" :key="p.id" class="product-row">
            <image
              class="product-thumb"
              :src="resolveImageUrl(p.coverImage, '/static/logo.svg')"
              mode="aspectFill"
            />
            <text class="product-name">{{ p.name }}</text>
            <view class="view-btn" @click="goProduct(p.id)">查看</view>
          </view>
          <view v-if="!theme.products?.length" class="empty">该系列暂无商品</view>
        </view>
      </scroll-view>
    </template>
    <view v-else class="state">系列不存在或已停用</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getCategoryDetail } from '@/api/catalog'
import { resolveImageUrl } from '@/utils/media'

const theme = ref(null)
const loading = ref(false)
const themeId = ref(0)

onLoad((q) => {
  themeId.value = Number(q.id)
  loadData()
})

async function loadData() {
  if (!themeId.value) return
  loading.value = true
  try {
    const res = await getCategoryDetail(themeId.value)
    theme.value = res.data
  } catch {
    theme.value = null
  } finally {
    loading.value = false
  }
}

function goProduct(id) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
}

.scroll {
  height: 100vh;
}

.header {
  padding: 32rpx 28rpx 16rpx;
  background: #fff;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #999;
}

.cover {
  width: 100%;
  display: block;
  background: #fff;
}

.product-list {
  margin-top: 16rpx;
  background: #fff;
  padding: 0 24rpx;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.product-row:last-child {
  border-bottom: none;
}

.product-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
  background: #f5f5f5;
}

.product-name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-btn {
  flex-shrink: 0;
  padding: 12rpx 32rpx;
  background: var(--color-primary, #ff6633);
  color: #fff;
  font-size: 26rpx;
  border-radius: 32rpx;
}

.state,
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx 24rpx;
  font-size: 28rpx;
}
</style>
