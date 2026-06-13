<template>
  <view class="page-wrap">
    <HomeNavBar title="品牌首页" @home="onNavHome" @search="goSearch" />
    <scroll-view scroll-y class="page" :scroll-top="scrollTop" scroll-with-animation>
    <view class="banner-wrap">
      <swiper
        class="banner-swiper"
        :autoplay="true"
        :circular="true"
        :interval="4000"
        indicator-dots
        indicator-color="rgba(255,255,255,0.4)"
        indicator-active-color="#ff6633"
      >
        <swiper-item v-for="(banner, i) in displayBanners" :key="banner.id || i">
          <image
            class="banner-img"
            :src="banner.imageSrc"
            mode="aspectFill"
            @click="onBannerTap(banner)"
          />
        </swiper-item>
      </swiper>
    </view>

    <view class="menu-card">
      <view class="menu-item" hover-class="menu-item--hover" @click="goCatalog">
        <view class="menu-icon">
          <image class="menu-icon-img" :src="homeMenuIcon" mode="aspectFit" />
        </view>
        <text class="menu-text">浏览商品</text>
      </view>
      <view class="menu-item" hover-class="menu-item--hover" @click="goMine">
        <view class="menu-icon">
          <image class="menu-icon-img" :src="homeUserIcon" mode="aspectFit" />
        </view>
        <text class="menu-text">我的</text>
      </view>
    </view>

    <view class="brand-card">
      <text class="section-title">品牌介绍</text>
      <image
        v-if="brandCoverSrc"
        class="brand-img"
        :src="brandCoverSrc"
        mode="widthFix"
      />
      <text class="brand-desc">{{ brandSummary }}</text>
      <view v-if="showIntroButton" class="brand-btn" @click="goIntro">
        <view class="brand-btn-icon">
          <view class="icon-chevron" />
        </view>
        <text class="brand-btn-text">查看公司简介</text>
      </view>
    </view>

    <view v-if="showcaseProducts.length" class="showcase-card">
      <text class="section-title">商品展示</text>
      <view class="showcase-grid">
        <view v-for="item in showcaseProducts" :key="item.id" class="showcase-item" @click="goProduct(item.id)">
          <image class="swatch-img" :src="resolveImageUrl(item.coverImage, '/static/logo.svg')" mode="aspectFill" />
          <text class="swatch-name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <view class="page-bottom" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import HomeNavBar from '@/components/HomeNavBar.vue'
import { getHomeProducts, getHomeContent } from '@/api/catalog'
import { resolveImageUrl } from '@/utils/media'
import homeMenuIcon from '../../../assets/svg/home-menu.svg'
import homeUserIcon from '../../../assets/svg/home-user.svg'

const DEFAULT_BANNERS = [
  '/static/banner/ban1.jpg',
  '/static/banner/ban2.jpg',
  '/static/banner/ban3.jpg',
]

const DEFAULT_BRAND_SUMMARY =
  '广州才汇纺织科技有限公司隶属于广州秀丽服装培训学院旗下一子公司。才汇纺织以面料研发、生产、销售为一体，旗下纺织产品有时装面料、工装面料等。'

const scrollTop = ref(0)
const showcaseProducts = ref([])
const apiBanners = ref([])
const brandContent = ref(null)

const displayBanners = computed(() => {
  if (apiBanners.value.length) {
    return apiBanners.value.map((item) => ({
      id: item.id,
      imageSrc: resolveImageUrl(item.imageUrl),
      linkUrl: item.linkUrl,
    }))
  }
  return DEFAULT_BANNERS.map((src, index) => ({
    id: `static-${index}`,
    imageSrc: src,
    linkUrl: '',
  }))
})

const brandCoverSrc = computed(() => {
  const url = brandContent.value?.homeCoverImage
  return url ? resolveImageUrl(url) : '/static/brand/a1.jpg'
})

const brandSummary = computed(() => brandContent.value?.homeSummary || DEFAULT_BRAND_SUMMARY)

const showIntroButton = computed(() => brandContent.value?.showIntroButton !== false)

function onBannerTap(banner) {
  const link = banner.linkUrl?.trim()
  if (!link) return
  if (!link.startsWith('/pages/')) return
  uni.navigateTo({ url: link })
}

function goCatalog() {
  uni.navigateTo({ url: '/pages/index' })
}

function goMine() {
  uni.navigateTo({ url: '/pages/mine/index' })
}

function goIntro() {
  uni.navigateTo({ url: '/pages/brand/intro' })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/index' })
}

function goProduct(id) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function onNavHome() {
  scrollTop.value = 1
  nextTick(() => {
    scrollTop.value = 0
  })
}

async function loadHomeContent() {
  try {
    const res = await getHomeContent()
    apiBanners.value = res.data?.banners || []
    brandContent.value = res.data?.brand || null
  } catch {
    apiBanners.value = []
    brandContent.value = null
  }
}

async function loadHomeProducts() {
  const res = await getHomeProducts()
  showcaseProducts.value = res.data
}

onMounted(() => {
  loadHomeContent()
  loadHomeProducts()
})
</script>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: #eeeeee;
}

.page {
  height: 100vh;
  background: #eeeeee;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.page :deep(.uni-scroll-view),
.page :deep(.uni-scroll-view-content) {
  background: #eeeeee;
}

.banner-wrap {
  width: 100%;
  margin: 0;
  padding: 0;
  line-height: 0;
  font-size: 0;
  vertical-align: top;
}

.banner-swiper {
  width: 100%;
  height: 936rpx;
  border-radius: 0;
  background: transparent;
  display: block;
}

.banner-swiper :deep(.uni-swiper-dot-active) {
  background: var(--color-primary) !important;
}

.banner-img {
  width: 100%;
  height: 936rpx;
  display: block;
  vertical-align: top;
}

.menu-card {
  display: flex;
  margin: 24rpx 24rpx 24rpx;
  padding: 36rpx 16rpx 28rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.menu-item--hover {
  opacity: 0.75;
}

.menu-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-text {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.menu-icon-img {
  width: 44rpx;
  height: 44rpx;
}

.brand-card {
  margin: 0 24rpx 24rpx;
  padding: 32rpx 28rpx 40rpx;
  background: #f0f4f5;
  border-radius: 20rpx;
}

.section-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 24rpx;
}

.brand-img {
  width: 100%;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.brand-desc {
  display: block;
  font-size: 26rpx;
  color: #555;
  line-height: 1.7;
  text-align: center;
  margin-bottom: 32rpx;
}

.brand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin: 0 auto;
  width: 360rpx;
  padding: 20rpx 0;
  background: #fff;
  border: 2rpx solid var(--color-primary);
  border-radius: 12rpx;
}

.brand-btn-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: var(--color-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-chevron {
  width: 14rpx;
  height: 14rpx;
  border-top: 4rpx solid var(--color-primary);
  border-right: 4rpx solid var(--color-primary);
  transform: rotate(45deg);
  margin-left: -4rpx;
}

.brand-btn-text {
  font-size: 28rpx;
  color: #333;
}

.showcase-card {
  margin: 0 24rpx 24rpx;
  padding: 32rpx 24rpx 40rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.showcase-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx 16rpx;
}

.showcase-item {
  width: calc(50% - 8rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.swatch-img {
  width: 100%;
  height: 280rpx;
  border-radius: 8rpx;
  background: #eee;
}

.swatch-name {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #333;
  text-align: center;
  line-height: 1.4;
  word-break: break-all;
}

.page-bottom {
  height: 48rpx;
}
</style>
