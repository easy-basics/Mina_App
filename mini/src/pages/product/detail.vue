<template>
  <view v-if="product" class="page">
    <swiper v-if="images.length" class="banner" indicator-dots circular>
      <swiper-item v-for="(img, i) in images" :key="i">
        <image :src="img" class="banner-img" mode="aspectFill" />
      </swiper-item>
    </swiper>
    <image v-else class="banner banner-img" :src="product.coverImage" mode="aspectFill" />

    <view class="info">
      <text class="title">{{ product.name }}</text>
      <view class="price-row">
        <text class="price-sample">板布价格 ¥ {{ product.minPrice ?? '-' }}元/米</text>
        <text class="price-bulk">大货价格 面议</text>
      </view>
      <view class="actions">
        <text class="action" @click="toggleFavorite">{{ product.favorited ? '已收藏' : '收藏' }}</text>
        <button open-type="share" class="action share-btn">分享</button>
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
      />
      <view v-if="!images.length" class="empty">暂无详情图</view>
    </view>

    <view v-else class="tab-body params-table">
      <view v-for="p in product.params" :key="p.id" class="param-row">
        <text class="param-name">{{ p.name }}</text>
        <text class="param-value">{{ p.value || '-' }}</text>
      </view>
    </view>

    <view class="footer-bar">
      <view class="footer-icon" @click="goStore">门店</view>
      <view class="footer-icon cart" @click="goCart">
        购物车
        <text v-if="cartCount > 0" class="badge">{{ cartCount }}</text>
      </view>
      <button class="btn-cart" @click="openAddCart">加购</button>
      <button class="btn-sample" @click="openOrder(ORDER_TYPES.SAMPLE)">板布下单</button>
      <button class="btn-bulk" @click="openOrder(ORDER_TYPES.BULK)">大货下单</button>
    </view>

    <OrderSheet
      v-model:visible="sheetVisible"
      :product="product"
      :order-type="sheetOrderType"
      :mode="sheetMode"
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
import { useCartStore } from '@/stores/cart'
import OrderSheet from '@/components/OrderSheet.vue'

const product = ref(null)
const tab = ref('detail')
const sheetVisible = ref(false)
const sheetOrderType = ref(ORDER_TYPES.SAMPLE)
const sheetMode = ref('order')
const productId = ref(0)
const cartStore = useCartStore()

const images = computed(() => {
  if (!product.value) return []
  const list = product.value.detailImages?.map((i) => i.url) || []
  if (list.length) return list
  return product.value.coverImage ? [product.value.coverImage] : []
})

const cartCount = computed(() => cartStore.count)

onLoad((query) => {
  productId.value = Number(query.id)
})

onShareAppMessage(() => ({
  title: product.value?.name || '布行好物',
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

function openOrder(type) {
  if (!ensureLogin()) return
  sheetOrderType.value = type
  sheetMode.value = 'order'
  sheetVisible.value = true
}

function goCart() {
  uni.navigateTo({ url: '/pages/cart/index' })
}

function goStore() {
  const names = product.value?.stores?.map((s) => s.name).join('、')
  uni.showModal({
    title: '可售门店',
    content: names || '暂无门店',
    showCancel: false,
  })
}

function openAddCart() {
  if (!ensureLogin()) return
  sheetOrderType.value = ORDER_TYPES.SAMPLE
  sheetMode.value = 'cart'
  sheetVisible.value = true
}

function onOrderSuccess() {
  cartStore.refresh()
}

onMounted(() => {
  loadProduct()
  cartStore.refresh()
})
</script>

<style scoped>
.page {
  padding-bottom: 120rpx;
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
.actions {
  display: flex;
  gap: 32rpx;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #666;
}
.share-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 26rpx;
  line-height: inherit;
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
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 12rpx 16rpx;
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.footer-icon {
  font-size: 22rpx;
  color: #666;
  padding: 0 12rpx;
  position: relative;
}
.badge {
  position: absolute;
  top: -8rpx;
  right: 0;
  background: #e53935;
  color: #fff;
  font-size: 18rpx;
  min-width: 28rpx;
  height: 28rpx;
  line-height: 28rpx;
  text-align: center;
  border-radius: 14rpx;
}
.btn-cart,
.btn-sample,
.btn-bulk {
  flex: 1;
  margin-left: 8rpx;
  font-size: 26rpx;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  padding: 0;
  line-height: 72rpx;
}
.btn-cart {
  background: var(--color-primary);
  max-width: 100rpx;
  flex: 0 0 100rpx;
}
.btn-sample {
  background: #e53935;
}
.btn-bulk {
  background: #43a047;
}
.empty {
  text-align: center;
  color: #999;
  padding: 40rpx;
}
</style>
