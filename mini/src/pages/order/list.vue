<template>
  <view class="page">
    <view class="tabs">
      <text class="tab" :class="{ active: type === 'sample' }" @click="switchType('sample')">布版订单</text>
      <text class="tab" :class="{ active: type === 'bulk' }" @click="switchType('bulk')">大货订单</text>
    </view>
    <view v-for="o in list" :key="o.id" class="order-card" @click="goDetail(o.id)">
      <view class="row">
        <text class="no">{{ o.orderNo }}</text>
        <text class="status" :class="statusClass(o)">{{ o.statusLabel }}</text>
      </view>
      <text class="store">{{ o.store?.name }}</text>
      <view class="row bottom">
        <text class="amount">¥{{ o.totalAmount }}</text>
        <text class="time">{{ formatTime(o.createdAt) }}</text>
      </view>
    </view>
    <view v-if="!loading && !list.length" class="empty">
      <text class="empty-text">暂无订单</text>
      <button class="empty-btn" @click="goCatalog">去逛逛商品</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getOrders } from '@/api/order'
import { ensureLogin } from '@/utils/request'

const type = ref('sample')
const list = ref([])
const loading = ref(false)

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

function statusClass(o) {
  if (o.status === 'pending_pay' || o.payStatus === 'unpaid') return 'status--warn'
  return ''
}

async function load() {
  if (!ensureLogin()) return
  loading.value = true
  try {
    const res = await getOrders({ orderType: type.value })
    list.value = res.data.list
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function switchType(t) {
  type.value = t
  load()
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/order/detail?id=${id}` })
}

function goCatalog() {
  uni.navigateTo({ url: '/pages/index' })
}

onShow(load)
onPullDownRefresh(load)
</script>

<style scoped>
.page {
  min-height: 100vh;
}
.tabs {
  display: flex;
  background: #fff;
  margin-bottom: 8rpx;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  font-size: 28rpx;
  color: #666;
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
  align-items: center;
}
.no {
  font-size: 26rpx;
  color: #666;
}
.status {
  color: var(--color-primary);
  font-size: 26rpx;
}
.status--warn {
  color: #e53935;
  font-weight: 600;
}
.store {
  font-size: 28rpx;
  color: #2d2a3e;
  margin: 12rpx 0;
  display: block;
}
.amount {
  color: #e53935;
  font-weight: 600;
  font-size: 30rpx;
}
.time {
  font-size: 24rpx;
  color: #999;
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
