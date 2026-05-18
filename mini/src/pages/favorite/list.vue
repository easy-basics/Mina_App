<template>
  <view class="page">
    <view
      v-for="p in list"
      :key="p.productId"
      class="card"
      @click="goDetail(p.id)"
    >
      <image :src="p.coverImage" class="thumb" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ p.code }}{{ p.name }}</text>
        <text class="cat">{{ p.category?.name }}</text>
      </view>
    </view>
    <view v-if="!list.length" class="empty">暂无收藏</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getFavorites } from '@/api/favorite'
import { ensureLogin } from '@/utils/request'

const list = ref([])

async function load() {
  if (!ensureLogin()) return
  const res = await getFavorites()
  list.value = res.data
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

onShow(load)
</script>

<style scoped>
.card {
  display: flex;
  background: #fff;
  margin: 16rpx;
  padding: 16rpx;
  border-radius: 12rpx;
}
.thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  background: #eee;
}
.info {
  margin-left: 16rpx;
}
.name {
  font-size: 28rpx;
}
.cat {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>
