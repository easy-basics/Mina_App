<template>
  <view class="page">
    <!-- #ifdef MP-WEIXIN -->
    <button class="import-btn" @click="importFromWechat">从微信导入地址</button>
    <!-- #endif -->
    <view v-for="a in list" :key="a.id" class="card" @click="edit(a)">
      <view class="row">
        <text class="name">{{ a.name }} {{ a.phone }}</text>
        <text v-if="a.isDefault" class="tag">默认</text>
      </view>
      <text class="addr">{{ a.province }}{{ a.city }}{{ a.district }}{{ a.detail }}</text>
      <text class="del" @click.stop="remove(a)">删除</text>
    </view>
    <view v-if="!list.length" class="empty">
      <text class="empty-text">暂无地址</text>
      <!-- #ifdef MP-WEIXIN -->
      <button class="empty-btn" @click="importFromWechat">从微信导入</button>
      <!-- #endif -->
    </view>
    <button class="add-btn" @click="add">新增地址</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAddresses, deleteAddress } from '@/api/address'
import { ensureLogin } from '@/utils/request'
import { chooseAndImportAddress } from '@/utils/wechatAddress'

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
  const res = await uni.showModal({ title: '提示', content: '确定删除该地址？' })
  if (!res.confirm) return
  await deleteAddress(a.id)
  uni.showToast({ title: '已删除' })
  load()
}

async function importFromWechat() {
  if (!ensureLogin()) return
  try {
    await chooseAndImportAddress()
    uni.showToast({ title: '已同步收货地址' })
    load()
  } catch (e) {
    if (e?.message === 'cancel') return
  }
}

onShow(load)
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 32rpx;
}
.import-btn {
  margin: 16rpx;
  background: #fff;
  color: var(--color-primary);
  border: 1rpx solid var(--color-primary);
  border-radius: 12rpx;
  font-size: 28rpx;
}
.import-btn::after {
  border: none;
}
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
.name {
  font-size: 30rpx;
  font-weight: 600;
  color: #2d2a3e;
}
.tag {
  font-size: 22rpx;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}
.addr {
  font-size: 26rpx;
  color: #666;
  margin-top: 12rpx;
  display: block;
  padding-right: 80rpx;
}
.del {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  font-size: 26rpx;
  color: #999;
}
.empty {
  text-align: center;
  padding: 80rpx 48rpx;
}
.empty-text {
  color: #999;
  font-size: 28rpx;
  display: block;
  margin-bottom: 24rpx;
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
.add-btn {
  margin: 16rpx;
  background: var(--color-primary);
  color: #fff;
  border-radius: 12rpx;
}
</style>
