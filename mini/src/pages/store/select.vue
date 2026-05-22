<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="stores.length === 0" class="state">暂无可用门店</view>
    <view v-else class="list">
      <view
        v-for="s in stores"
        :key="s.id"
        class="store-card"
        hover-class="store-card--hover"
        @click="selectStore(s)"
      >
        <view class="store-info">
          <text class="store-name">{{ s.name }}</text>
          <text v-if="s.address" class="store-meta">{{ s.address }}</text>
          <text v-if="s.phone" class="store-meta">{{ s.phone }}</text>
          <text v-if="s.contact" class="store-meta">联系人：{{ s.contact }}</text>
        </view>
        <text class="store-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStores } from '@/api/catalog'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const stores = ref([])
const loading = ref(true)

async function loadStores() {
  loading.value = true
  try {
    const res = await getStores()
    stores.value = res.data || []
  } catch {
    stores.value = []
    uni.showToast({ title: '加载门店失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function selectStore(store) {
  sessionStore.setStore(store)
  uni.navigateTo({ url: '/pages/index' })
}

onMounted(loadStores)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 24rpx;
}

.state {
  text-align: center;
  color: #999;
  padding: 120rpx 0;
  font-size: 28rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.store-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.store-card--hover {
  background: var(--color-primary-bg);
}

.store-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.store-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.store-meta {
  font-size: 26rpx;
  color: #888;
  line-height: 1.5;
}

.store-arrow {
  font-size: 48rpx;
  color: var(--color-primary);
  font-weight: 300;
  margin-left: 16rpx;
}
</style>
