<template>
  <view class="page">
    <ShopInfoCard :shop="shopInfo" />
    <view class="search-bar">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索想要的商品"
        confirm-type="search"
        @confirm="loadProducts"
      />
    </view>
    <view class="main">
      <scroll-view scroll-y class="sidebar">
        <view
          v-for="cat in categories"
          :key="cat.id"
          class="cat-item"
          :class="{ active: cat.id === activeCategoryId }"
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </view>
      </scroll-view>
      <scroll-view scroll-y class="product-panel" @scrolltolower="loadMore">
        <view class="product-grid">
          <view v-for="p in products" :key="p.id" class="grid-item">
            <ProductCard :product="p" @click="(item) => goDetail(item.id)" />
          </view>
        </view>
        <view v-if="!loading && products.length === 0" class="empty">暂无商品</view>
        <view v-if="loading" class="loading">加载中...</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories, getProducts, getShopInfo } from '@/api/catalog'
import ProductCard from '@/components/ProductCard.vue'
import ShopInfoCard from '@/components/ShopInfoCard.vue'

const categories = ref([])
const products = ref([])
const shopInfo = ref(null)
const activeCategoryId = ref(null)
const keyword = ref('')
const loading = ref(false)
const page = ref(1)
const total = ref(0)

async function loadShopInfo() {
  try {
    const res = await getShopInfo()
    shopInfo.value = res.data
  } catch {
    shopInfo.value = null
  }
}

async function loadCategories() {
  const res = await getCategories()
  categories.value = res.data
  if (categories.value.length && !activeCategoryId.value) {
    activeCategoryId.value = categories.value[0].id
    loadProducts(true)
  }
}

async function loadProducts(reset = false) {
  if (reset) page.value = 1
  loading.value = true
  try {
    const res = await getProducts({
      categoryId: activeCategoryId.value,
      keyword: keyword.value,
      page: page.value,
      pageSize: 20,
    })
    if (reset) {
      products.value = res.data.list
    } else {
      products.value = [...products.value, ...res.data.list]
    }
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function selectCategory(id) {
  activeCategoryId.value = id
  loadProducts(true)
}

function loadMore() {
  if (products.value.length >= total.value || loading.value) return
  page.value += 1
  loadProducts()
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

onMounted(() => {
  loadShopInfo()
  loadCategories()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.search-bar {
  padding: 16rpx 24rpx;
  background: #fff;
}
.search-input {
  background: #f5f5f5;
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
}
.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.sidebar {
  width: 200rpx;
  background: #fff;
  height: 100%;
}
.cat-item {
  padding: 28rpx 16rpx;
  font-size: 26rpx;
  color: #666;
  border-left: 6rpx solid transparent;
}
.cat-item.active {
  color: var(--color-primary);
  font-weight: 600;
  background: var(--color-primary-bg);
  border-left-color: var(--color-primary);
}
.product-panel {
  flex: 1;
  height: 100%;
  padding: 18rpx 16rpx 24rpx;
}
.product-grid {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.grid-item {
  width: 100%;
}
.empty,
.loading {
  text-align: center;
  color: #999;
  padding: 40rpx;
}
</style>
