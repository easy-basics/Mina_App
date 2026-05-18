<template>
  <view class="page">
    <view v-for="a in list" :key="a.id" class="card" @click="edit(a)">
      <view class="row">
        <text class="name">{{ a.name }} {{ a.phone }}</text>
        <text v-if="a.isDefault" class="tag">默认</text>
      </view>
      <text class="addr">{{ a.province }}{{ a.city }}{{ a.district }}{{ a.detail }}</text>
      <text class="del" @click.stop="remove(a)">删除</text>
    </view>
    <view v-if="!list.length" class="empty">暂无地址</view>
    <button class="add-btn" @click="add">新增地址</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAddresses, deleteAddress } from '@/api/address'
import { ensureLogin } from '@/utils/request'

const list = ref([])

async function load() {
  if (!ensureLogin()) return
  const res = await getAddresses()
  list.value = res.data
}

function add() {
  uni.navigateTo({ url: '/pages/address/edit' })
}

function edit(a) {
  uni.navigateTo({ url: `/pages/address/edit?id=${a.id}` })
}

async function remove(a) {
  await deleteAddress(a.id)
  load()
}

onShow(load)
</script>

<style scoped>
.card {
  background: #fff;
  margin: 16rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  position: relative;
}
.row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.tag {
  font-size: 22rpx;
  color: #7b61ff;
  border: 1rpx solid #7b61ff;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}
.addr {
  font-size: 26rpx;
  color: #666;
  margin-top: 12rpx;
  display: block;
}
.del {
  position: absolute;
  right: 24rpx;
  top: 24rpx;
  color: #999;
  font-size: 24rpx;
}
.add-btn {
  margin: 32rpx;
  background: #7b61ff;
  color: #fff;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60rpx;
}
</style>
