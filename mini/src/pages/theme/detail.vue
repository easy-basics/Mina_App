<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <template v-else-if="theme">
      <scroll-view scroll-y class="scroll">
        <view class="header">
          <view class="header-main">
            <text class="title">{{ theme.name }}</text>
            <text v-if="theme.subtitle" class="subtitle">{{ theme.subtitle }}</text>
          </view>
          <view class="share-btn" @click="shareSheetVisible = true">
            <image class="share-icon" :src="shareIcon" mode="aspectFit" />
          </view>
        </view>
        <image
          class="cover"
          :src="coverSrc"
          mode="widthFix"
          @click="previewCover"
        />
        <view class="product-list">
          <view v-for="p in theme.products" :key="p.id" class="product-row">
            <image
              class="product-thumb"
              :src="resolveImageUrl(p.coverImage, '/static/logo.svg')"
              mode="aspectFill"
            />
            <text class="product-name">{{ p.name }}</text>
            <view class="view-btn" @click="goProduct(p.id)">查看</view>
          </view>
          <view v-if="!theme.products?.length" class="empty">该系列暂无商品</view>
        </view>
      </scroll-view>

      <ThemeShareSheet
        v-model:visible="shareSheetVisible"
        @poster="openPoster"
      />
      <ThemePosterModal v-model:visible="posterVisible" :theme="theme" />
    </template>
    <view v-else class="state">系列不存在或已停用</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getCategoryDetail } from '@/api/catalog'
import { resolveImageUrl, previewImages } from '@/utils/media'
import ThemeShareSheet from '@/components/ThemeShareSheet.vue'
import ThemePosterModal from '@/components/ThemePosterModal.vue'
import shareIcon from '../../../assets/svg/share-black.svg'

const theme = ref(null)
const loading = ref(false)
const themeId = ref(0)
const shareSheetVisible = ref(false)
const posterVisible = ref(false)

const shareTitle = computed(() => {
  if (!theme.value) return '才汇纺织'
  const { name, subtitle } = theme.value
  if (name && subtitle) return `${name}-${subtitle}`
  return name || '才汇纺织'
})

const coverSrc = computed(() =>
  resolveImageUrl(theme.value?.coverImage, '/static/logo.svg')
)

onLoad((query) => {
  if (query.scene) {
    const scene = decodeURIComponent(query.scene)
    const match = scene.match(/cid=(\d+)/)
    themeId.value = match ? Number(match[1]) : Number(query.id)
  } else {
    themeId.value = Number(query.id)
  }
  loadData()
})

onShareAppMessage(() => ({
  title: shareTitle.value,
  path: `/pages/theme/detail?id=${themeId.value}`,
  imageUrl: resolveImageUrl(theme.value?.coverImage) || undefined,
}))

async function loadData() {
  if (!themeId.value) return
  loading.value = true
  try {
    const res = await getCategoryDetail(themeId.value)
    theme.value = res.data
  } catch {
    theme.value = null
  } finally {
    loading.value = false
  }
}

function goProduct(id) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function openPoster() {
  shareSheetVisible.value = false
  posterVisible.value = true
}

function previewCover() {
  if (coverSrc.value) previewImages([coverSrc.value], 0)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
}

.scroll {
  height: 100vh;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding: 32rpx 28rpx 16rpx;
  background: #fff;
}

.header-main {
  flex: 1;
  min-width: 0;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #999;
}

.share-btn {
  flex-shrink: 0;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-icon {
  width: 44rpx;
  height: 44rpx;
}

.cover {
  width: 100%;
  display: block;
  background: #fff;
}

.product-list {
  margin-top: 16rpx;
  background: #fff;
  padding: 0 24rpx;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.product-row:last-child {
  border-bottom: none;
}

.product-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
  background: #f5f5f5;
}

.product-name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-btn {
  flex-shrink: 0;
  padding: 12rpx 32rpx;
  background: var(--color-primary, #ff6633);
  color: #fff;
  font-size: 26rpx;
  border-radius: 32rpx;
}

.state,
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx 24rpx;
  font-size: 28rpx;
}
</style>
