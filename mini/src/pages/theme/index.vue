<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="state">加载中...</view>
      <view v-else-if="!categories.length" class="state">暂无系列主题</view>
      <view v-else class="list">
        <view
          v-for="item in categories"
          :key="item.id"
          class="card"
          hover-class="card--hover"
          @click="goDetail(item.id)"
        >
          <text class="card-title">{{ item.name }}</text>
          <text v-if="item.subtitle" class="card-subtitle">{{ item.subtitle }}</text>
          <image
            class="card-cover"
            :src="resolveImageUrl(item.coverImage, '/static/logo.svg')"
            mode="widthFix"
          />
        </view>
      </view>
      <view class="tab-placeholder" />
    </scroll-view>
    <CatalogTabBar active="theme" />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories } from '@/api/catalog'
import { resolveImageUrl } from '@/utils/media'
import CatalogTabBar from '@/components/CatalogTabBar.vue'

const categories = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } finally {
    loading.value = false
  }
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/theme/detail?id=${id}` })
}

onMounted(loadData)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
}

.scroll {
  height: 100vh;
  box-sizing: border-box;
}

.list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx 28rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.card--hover {
  opacity: 0.92;
}

.card-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
}

.card-subtitle {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.card-cover {
  width: 100%;
  border-radius: 8rpx;
  display: block;
}

.state {
  text-align: center;
  color: #999;
  padding: 80rpx 24rpx;
  font-size: 28rpx;
}

.tab-placeholder {
  height: calc(100rpx + env(safe-area-inset-bottom));
}
</style>
