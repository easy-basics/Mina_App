<template>
  <view v-if="order" class="page">
    <view class="card">
      <text class="label">订单号</text>
      <text>{{ order.orderNo }}</text>
      <text class="label">状态</text>
      <text>{{ order.statusLabel }} · {{ order.payStatusLabel }}</text>
      <text v-if="order.orderType === 'sample'" class="label">配送方式</text>
      <text v-if="order.orderType === 'sample'">
        {{ order.deliveryType === 'express' ? '邮寄' : '自提' }}
      </text>
      <text v-if="order.orderType === 'sample' && order.deliveryType === 'pickup' && order.pickup?.address" class="label">自提地址</text>
      <text v-if="order.orderType === 'sample' && order.deliveryType === 'pickup' && order.pickup?.address">
        {{ order.pickup.name }} {{ order.pickup.address }}
        <text v-if="order.pickup.phone"> {{ order.pickup.phone }}</text>
      </text>
      <text v-if="order.orderType === 'sample' && order.deliveryType === 'express' && order.address" class="label">收货地址</text>
      <text v-if="order.orderType === 'sample' && order.deliveryType === 'express' && order.address">
        {{ formatAddress(order.address) }}
      </text>
      <text v-if="order.remark" class="label">订单备注</text>
      <text v-if="order.remark">{{ order.remark }}</text>
      <text class="label">金额</text>
      <text class="amount">{{ order.orderType === 'bulk' ? '面议' : `¥${order.totalAmount}` }}</text>
    </view>
    <view class="card">
      <text class="section">商品明细</text>
      <view v-for="item in order.items" :key="item.id" class="item-row">
        <text>{{ item.specName }} x {{ item.quantity }}</text>
        <text>{{ order.orderType === 'bulk' ? '面议' : `¥${item.unitPrice}` }}</text>
      </view>
    </view>
    <button
      v-if="order.orderType === 'sample' && order.payStatus === 'unpaid'"
      class="pay-btn"
      @click="doPay"
    >
      去支付
    </button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrder } from '@/api/order'
import { paySampleOrder } from '@/utils/payOrder'

const order = ref(null)
const orderId = ref(0)

onLoad((q) => {
  orderId.value = Number(q.id)
})

function formatAddress(addr) {
  if (!addr) return ''
  return `${addr.name} ${addr.phone} ${addr.province || ''}${addr.city || ''}${addr.district || ''}${addr.detail || ''}`
}

async function load() {
  const res = await getOrder(orderId.value)
  order.value = res.data
}

async function doPay() {
  try {
    await paySampleOrder(orderId.value)
    uni.showToast({ title: '支付成功' })
    load()
  } catch {
    uni.showToast({ title: '支付失败', icon: 'none' })
  }
}

onMounted(load)
</script>

<style scoped>
.card {
  background: #fff;
  margin: 16rpx;
  padding: 24rpx;
  border-radius: 12rpx;
}
.label {
  display: block;
  color: #999;
  font-size: 24rpx;
  margin-top: 16rpx;
}
.amount {
  color: #e53935;
  font-size: 32rpx;
  font-weight: 600;
}
.section {
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}
.item-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 26rpx;
}
.pay-btn {
  margin: 32rpx;
  background: #e53935;
  color: #fff;
}
</style>
