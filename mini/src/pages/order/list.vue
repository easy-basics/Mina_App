<template>
  <view class="page">
    <view class="tabs">
      <text class="tab" :class="{ active: type === 'sample' }" @click="switchType('sample')">布版订单</text>
      <text class="tab" :class="{ active: type === 'bulk' }" @click="switchType('bulk')">大货订单</text>
    </view>
    <view v-for="o in list" :key="o.id" class="order-card" @click="goDetail(o.id)">
      <view class="row">
        <text class="no">{{ o.orderNo }}</text>
        <text class="status">{{ o.statusLabel }}</text>
      </view>
      <text class="store">{{ o.store?.name }}</text>
      <view class="row bottom">
        <text class="amount">¥{{ o.totalAmount }}</text>
        <text class="time">{{ formatTime(o.createdAt) }}</text>
      </view>
    </view>
    <view v-if="!list.length" class="empty">暂无订单</view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getOrders } from '@/api/order'
import { ensureLogin } from '@/utils/request'

const type = ref('sample')
const list = ref([])

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

async function load() {
  if (!ensureLogin()) return
  const res = await getOrders({ orderType: type.value })
  list.value = res.data.list
}

function switchType(t) {
  type.value = t
  load()
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/order/detail?id=${id}` })
}

onShow(load)
</script>

<style scoped>
.tabs {
  display: flex;
  background: #fff;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  font-size: 28rpx;
}
.tab.active {
  color: var(--color-primary);
  font-weight: 600;
  border-bottom: 4rpx solid var(--color-primary);
}
.order-card {
  background: #fff;
  margin: 16rpx;
  padding: 24rpx;
  border-radius: 12rpx;
}
.row {
  display: flex;
  justify-content: space-between;
}
.status {
  color: var(--color-primary);
  font-size: 26rpx;
}
.store {
  font-size: 26rpx;
  color: #666;
  margin: 12rpx 0;
  display: block;
}
.amount {
  color: #e53935;
  font-weight: 600;
}
.time {
  font-size: 24rpx;
  color: #999;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
</style>
