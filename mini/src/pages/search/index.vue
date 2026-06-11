<template>
  <view class="page">
    <SearchBar v-model="keyword" @search="doSearch" />

    <view v-if="history.length" class="history-section">
      <view class="history-header">
        <text class="history-title">搜索历史</text>
        <view class="trash-btn" @click="onClearHistory">
          <view class="trash-icon" />
        </view>
      </view>
      <view class="history-tags">
        <text
          v-for="item in history"
          :key="item"
          class="history-tag"
          @click="searchKeyword(item)"
        >{{ item }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import SearchBar from '@/components/SearchBar.vue'
import {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} from '@/utils/searchHistory'

const keyword = ref('')
const history = ref([])

function refreshHistory() {
  history.value = getSearchHistory()
}

function goResult(kw) {
  const q = encodeURIComponent(kw.trim())
  uni.navigateTo({ url: `/pages/search/result?keyword=${q}` })
}

function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' })
    return
  }
  addSearchHistory(kw)
  goResult(kw)
}

function searchKeyword(kw) {
  keyword.value = kw
  addSearchHistory(kw)
  goResult(kw)
}

function onClearHistory() {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史吗？',
    success(res) {
      if (res.confirm) {
        clearSearchHistory()
        refreshHistory()
      }
    },
  })
}

onShow(refreshHistory)
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #fff;
}

.history-section {
  padding: 24rpx 24rpx 0;
  border-top: 1rpx solid #f0f0f0;
  margin-top: 16rpx;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.history-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.trash-btn {
  padding: 8rpx;
}

.trash-icon {
  width: 32rpx;
  height: 36rpx;
  border: 3rpx solid #999;
  border-top: none;
  border-radius: 0 0 6rpx 6rpx;
  position: relative;
  box-sizing: border-box;
}

.trash-icon::before {
  content: '';
  position: absolute;
  top: -10rpx;
  left: -6rpx;
  right: -6rpx;
  height: 6rpx;
  border: 3rpx solid #999;
  border-radius: 4rpx 4rpx 0 0;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.history-tag {
  padding: 12rpx 28rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
}
</style>
