<template>
  <view v-if="product" class="page">
    <swiper v-if="images.length" class="banner" indicator-dots circular>
      <swiper-item v-for="(img, i) in images" :key="i">
        <image :src="img" class="banner-img" mode="aspectFill" @click="previewImageAt(i)" />
      </swiper-item>
    </swiper>
    <image v-else class="banner banner-img" :src="coverSrc" mode="aspectFill" @click="previewImageAt(0)" />

    <view class="info">
      <text class="title">{{ product.name }}</text>
      <view class="price-row">
        <text class="price-sample">板布价格 ¥ {{ product.minPrice ?? '-' }}元/米</text>
        <text class="price-bulk">大货价格 面议</text>
      </view>
    </view>

    <view class="tabs">
      <text class="tab" :class="{ active: tab === 'detail' }" @click="tab = 'detail'">商品详情</text>
      <text class="tab" :class="{ active: tab === 'params' }" @click="tab = 'params'">商品参数</text>
    </view>

    <view v-if="tab === 'detail'" class="tab-body">
      <image
        v-for="(img, i) in images"
        :key="'d' + i"
        :src="img"
        class="detail-img"
        mode="widthFix"
        @click="previewImageAt(i)"
      />
      <view v-if="!images.length" class="empty">暂无详情图</view>
    </view>

    <view v-else class="tab-body params-table">
      <view v-for="p in product.params" :key="p.id" class="param-row">
        <text class="param-name">{{ p.name }}</text>
        <text class="param-value">{{ p.value || '-' }}</text>
      </view>
    </view>

    <view class="float-cart" @click="goCart">
      <image class="float-cart-icon" :src="shoppingCartIcon" mode="aspectFit" />
      <text v-if="cartCount > 0" class="float-badge">{{ cartCount > 99 ? '99+' : cartCount }}</text>
    </view>

    <view class="footer-bar">
      <view
        class="footer-round-btn"
        :class="{ favorited: product.favorited }"
        @click="toggleFavorite"
      >
        <image class="footer-icon" :src="favoriteIcon" mode="aspectFit" />
      </view>
      <button open-type="share" class="footer-round-btn footer-share-btn">
        <image class="footer-icon" :src="shareIcon" mode="aspectFit" />
      </button>
      <button class="btn-order" @click="openOrderTypePicker">去下单</button>
    </view>

    <OrderTypePicker v-model:visible="typePickerVisible" @select="onPickOrderType" />
    <OrderSheet
      v-model:visible="sheetVisible"
      :product="product"
      :order-type="sheetOrderType"
      @success="onOrderSuccess"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getProduct } from '@/api/catalog'
import { addFavorite, removeFavorite } from '@/api/favorite'
import { ORDER_TYPES } from '@/constants/orders'
import { ensureLogin } from '@/utils/request'
import { resolveImageUrl, previewImages } from '@/utils/media'
import { useCartStore } from '@/stores/cart'
import OrderSheet from '@/components/OrderSheet.vue'
import OrderTypePicker from '@/components/OrderTypePicker.vue'
import favoriteIcon from '../../../assets/svg/favorite.svg'
import shareIcon from '../../../assets/svg/share.svg'
import shoppingCartIcon from '../../../assets/svg/shoppingCart.svg'

const product = ref(null)
const tab = ref('detail')
const typePickerVisible = ref(false)
const sheetVisible = ref(false)
const sheetOrderType = ref(ORDER_TYPES.SAMPLE)
const productId = ref(0)
const cartStore = useCartStore()

const images = computed(() => {
  if (!product.value) return []
  const list = product.value.detailImages?.map((i) => resolveImageUrl(i.url)).filter(Boolean) || []
  if (list.length) return list
  const cover = resolveImageUrl(product.value.coverImage)
  return cover ? [cover] : []
})

const coverSrc = computed(() => resolveImageUrl(product.value?.coverImage))

const cartCount = computed(() => cartStore.count)

onLoad((query) => {
  if (query.scene) {
    const scene = decodeURIComponent(query.scene)
    const match = scene.match(/id=(\d+)/)
    productId.value = match ? Number(match[1]) : Number(query.id)
  } else {
    productId.value = Number(query.id)
  }
})

onShareAppMessage(() => ({
  title: product.value?.name || '才汇纺织',
  path: `/pages/product/detail?id=${productId.value}`,
}))

async function loadProduct() {
  const res = await getProduct(productId.value)
  product.value = res.data
}

async function toggleFavorite() {
  if (!ensureLogin()) return
  if (product.value.favorited) {
    await removeFavorite(productId.value)
    product.value.favorited = false
    uni.showToast({ title: '已取消收藏' })
  } else {
    await addFavorite(productId.value)
    product.value.favorited = true
    uni.showToast({ title: '已收藏' })
  }
}

function openOrderTypePicker() {
  if (!ensureLogin()) return
  typePickerVisible.value = true
}

function onPickOrderType(type) {
  sheetOrderType.value = type
  sheetVisible.value = true
}

function goCart() {
  uni.navigateTo({ url: '/pages/cart/index' })
}

function onOrderSuccess() {
  cartStore.refresh()
}

function previewImageAt(index) {
  const list = images.value.length
    ? images.value
    : coverSrc.value
      ? [coverSrc.value]
      : []
  previewImages(list, index)
}

onMounted(() => {
  loadProduct()
  cartStore.refresh()
})
</script>

<style scoped>
.page {
  padding-bottom: 160rpx;
}
.banner {
  height: 560rpx;
}
.banner-img {
  width: 100%;
  height: 560rpx;
  background: #eee;
}
.info {
  background: #fff;
  padding: 24rpx;
}
.title {
  font-size: 34rpx;
  font-weight: 600;
}
.price-row {
  margin-top: 16rpx;
}
.price-sample {
  color: #e53935;
  font-size: 28rpx;
  display: block;
}
.price-bulk {
  color: #e53935;
  font-size: 28rpx;
  margin-top: 8rpx;
  display: block;
}
.tabs {
  display: flex;
  background: #fff;
  margin-top: 16rpx;
  border-bottom: 1rpx solid #eee;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  font-size: 28rpx;
  color: #666;
}
.tab.active {
  color: #e53935;
  font-weight: 600;
  border-bottom: 4rpx solid #e53935;
}
.tab-body {
  background: #fff;
  min-height: 300rpx;
}
.detail-img {
  width: 100%;
  display: block;
}
.params-table {
  padding: 0;
}
.param-row {
  display: flex;
  border-bottom: 1rpx solid #eee;
}
.param-name {
  width: 200rpx;
  padding: 24rpx 16rpx;
  background: #f7f7f7;
  color: #666;
  font-size: 26rpx;
}
.param-value {
  flex: 1;
  padding: 24rpx 16rpx;
  font-size: 26rpx;
}
.float-cart {
  position: fixed;
  right: 24rpx;
  bottom: calc(140rpx + env(safe-area-inset-bottom));
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}
.float-cart-icon {
  width: 44rpx;
  height: 44rpx;
}
.float-badge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 8rpx;
  background: #e53935;
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  border-radius: 16rpx;
  box-sizing: border-box;
}
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #fff;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
}
.footer-round-btn {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #4a4a4a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  margin: 0;
  border: none;
  line-height: 1;
}
.footer-round-btn.favorited {
  background: #ffb300;
}
.footer-share-btn::after {
  border: none;
}
.footer-icon {
  width: 40rpx;
  height: 40rpx;
}
.btn-order {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  background: var(--color-primary);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  border-radius: 999rpx;
  margin: 0;
  padding: 0;
}
.btn-order::after {
  border: none;
}
.empty {
  text-align: center;
  color: #999;
  padding: 40rpx;
}
</style>
