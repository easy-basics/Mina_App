<template>
  <view class="page">
    <view v-for="p in list" :key="p.productId" class="card">
      <view class="card-main" @click="goDetail(p.id)">
        <image :src="p.coverImage" class="thumb" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ p.code }}{{ p.name }}</text>
          <text class="cat">{{ p.category?.name }}</text>
        </view>
      </view>
      <button class="unfav-btn" @click.stop="unfav(p)">取消收藏</button>
    </view>
    <view v-if="!loading && !list.length" class="empty">
      <text class="empty-text">暂无收藏</text>
      <button class="empty-btn" @click="goCatalog">去逛逛商品</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getFavorites, removeFavorite } from '@/api/favorite'
import { ensureLogin } from '@/utils/request'

const list = ref([])
const loading = ref(false)

async function load() {
  if (!ensureLogin()) return
  loading.value = true
  try {
    const res = await getFavorites()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function goCatalog() {
  uni.navigateTo({ url: '/pages/index' })
}

async function unfav(p) {
  await removeFavorite(p.id)
  uni.showToast({ title: '已取消收藏' })
  load()
}

onShow(load)
</script>

<style scoped>
.page {
  min-height: 100vh;
}
.card {
  display: flex;
  align-items: center;
  background: #fff;
  margin: 16rpx;
  padding: 16rpx;
  border-radius: 12rpx;
}
.card-main {
  flex: 1;
  display: flex;
  min-width: 0;
}
.thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  background: #eee;
  flex-shrink: 0;
}
.info {
  margin-left: 16rpx;
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 28rpx;
  color: #2d2a3e;
  display: block;
}
.cat {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}
.unfav-btn {
  flex-shrink: 0;
  margin: 0 0 0 16rpx;
  padding: 0 20rpx;
  height: 56rpx;
  line-height: 56rpx;
  font-size: 24rpx;
  color: #999;
  background: #f5f5f5;
  border-radius: 8rpx;
}
.unfav-btn::after {
  border: none;
}
.empty {
  text-align: center;
  padding: 120rpx 48rpx;
}
.empty-text {
  color: #999;
  font-size: 28rpx;
  display: block;
  margin-bottom: 32rpx;
}
.empty-btn {
  display: inline-block;
  background: var(--color-primary);
  color: #fff;
  font-size: 28rpx;
  padding: 0 48rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
}
</style>
