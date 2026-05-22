<template>
  <scroll-view scroll-y class="page">
    <view class="banner-wrap">
      <swiper
        class="banner-swiper"
        :autoplay="true"
        :circular="true"
        :interval="4000"
        indicator-dots
        indicator-color="rgba(255,255,255,0.4)"
        indicator-active-color="#ffffff"
      >
        <swiper-item v-for="(img, i) in banners" :key="i">
          <image class="banner-img" :src="img" mode="aspectFill" />
        </swiper-item>
      </swiper>
    </view>

    <view class="menu-card">
      <view class="menu-item" hover-class="menu-item--hover" @click="goCatalog">
        <view class="menu-icon">
          <view class="icon-grid">
            <view class="grid-cell" />
            <view class="grid-cell" />
            <view class="grid-cell" />
            <view class="grid-cell" />
          </view>
        </view>
        <text class="menu-text">浏览商品</text>
      </view>
      <view class="menu-item" hover-class="menu-item--hover" @click="goStoreSelect">
        <view class="menu-icon">
          <view class="icon-cart">
            <view class="cart-body" />
            <view class="cart-wheel cart-wheel-l" />
            <view class="cart-wheel cart-wheel-r" />
          </view>
        </view>
        <text class="menu-text">进店下单</text>
      </view>
      <view class="menu-item" hover-class="menu-item--hover" @click="goMine">
        <view class="menu-icon">
          <view class="icon-user">
            <view class="user-head" />
            <view class="user-body" />
          </view>
        </view>
        <text class="menu-text">我的</text>
      </view>
    </view>

    <view class="brand-card">
      <text class="section-title">品牌介绍</text>
      <image class="brand-img" src="/static/brand/a1.jpg" mode="widthFix" />
      <text class="brand-desc">
        广州才汇纺织科技有限公司隶属于广州秀丽服装培训学院旗下一子公司。才汇纺织以面料研发、生产、销售为一体，旗下纺织产品有时装面料、工装面料等。
      </text>
      <view class="brand-btn" @click="goIntro">
        <view class="brand-btn-icon">
          <view class="icon-chevron" />
        </view>
        <text class="brand-btn-text">查看公司简介</text>
      </view>
    </view>

    <view class="showcase-card">
      <text class="section-title">商品展示</text>
      <view class="showcase-grid">
        <view v-for="item in showcaseProducts" :key="item.code" class="showcase-item">
          <image class="swatch-img" :src="item.image" mode="aspectFill" />
          <text class="swatch-code">{{ item.code }}</text>
        </view>
      </view>
    </view>

    <view class="page-bottom" />
  </scroll-view>
</template>

<script setup>
const banners = [
  '/static/banner/ban1.jpg',
  '/static/banner/ban2.jpg',
  '/static/banner/ban3.jpg',
]

const showcaseProducts = [
  { code: 'SCH-001', image: '/static/showcase/sch-001.jpg' },
  { code: 'SCH-002', image: '/static/showcase/sch-002.jpg' },
  { code: 'SCH-003', image: '/static/showcase/sch-003.jpg' },
  { code: 'SCH-004', image: '/static/showcase/sch-004.jpg' },
  { code: 'SCH-005', image: '/static/showcase/sch-005.jpg' },
  { code: 'SCH-006', image: '/static/showcase/sch-006.jpg' },
]

function goCatalog() {
  uni.navigateTo({ url: '/pages/index' })
}

function goStoreSelect() {
  uni.navigateTo({ url: '/pages/store/select' })
}

function goMine() {
  uni.navigateTo({ url: '/pages/mine/index' })
}

function goIntro() {
  uni.navigateTo({ url: '/pages/brand/intro' })
}
</script>

<style scoped>
.page {
  height: 100vh;
  background: #eeeeee;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.banner-wrap {
  width: 100%;
  margin: 0;
  padding: 0;
}

.banner-swiper {
  width: 100%;
  height: 360rpx;
  border-radius: 0;
}

.banner-img {
  width: 100%;
  height: 360rpx;
  display: block;
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

/* 浏览商品 - 网格图标 */
.icon-grid {
  display: flex;
  flex-wrap: wrap;
  width: 40rpx;
  height: 40rpx;
  gap: 6rpx;
}

.grid-cell {
  width: 16rpx;
  height: 16rpx;
  background: #fff;
  border-radius: 3rpx;
}

/* 购物车图标 */
.icon-cart {
  position: relative;
  width: 44rpx;
  height: 40rpx;
}

.cart-body {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 36rpx;
  height: 24rpx;
  border: 4rpx solid #fff;
  border-radius: 4rpx 4rpx 8rpx 8rpx;
  border-top: none;
}

.cart-body::before {
  content: '';
  position: absolute;
  top: -14rpx;
  left: -2rpx;
  width: 16rpx;
  height: 12rpx;
  border: 4rpx solid #fff;
  border-bottom: none;
  border-radius: 8rpx 8rpx 0 0;
}

.cart-wheel {
  position: absolute;
  bottom: 0;
  width: 10rpx;
  height: 10rpx;
  background: #fff;
  border-radius: 50%;
}

.cart-wheel-l {
  left: 10rpx;
}

.cart-wheel-r {
  right: 10rpx;
}

/* 用户图标 */
.icon-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.user-head {
  width: 28rpx;
  height: 28rpx;
  background: #fff;
  border-radius: 50%;
}

.user-body {
  width: 44rpx;
  height: 22rpx;
  background: #fff;
  border-radius: 22rpx 22rpx 0 0;
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
}

.swatch-img {
  width: 100%;
  height: 280rpx;
  border-radius: 8rpx;
  background: #eee;
}

.swatch-code {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #888;
}

.page-bottom {
  height: 48rpx;
}
</style>
