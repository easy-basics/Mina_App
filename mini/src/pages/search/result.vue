<template>
  <view class="page">
    <SearchBar
      v-model="keyword"
      :clearable="true"
      :show-button="false"
      @search="loadProducts(true)"
      @clear="loadProducts(true)"
    />

    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <ProductGrid
        :products="products"
        :loading="loading"
        empty-text="未找到相关商品"
        @select="goDetail"
      />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SearchBar from '@/components/SearchBar.vue'
import ProductGrid from '@/components/ProductGrid.vue'
import { getProducts } from '@/api/catalog'
import { addSearchHistory } from '@/utils/searchHistory'

const keyword = ref('')
const products = ref([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)

async function loadProducts(reset = false) {
  const kw = keyword.value.trim()
  if (!kw) {
    products.value = []
    total.value = 0
    return
  }
  if (reset) page.value = 1
  loading.value = true
  try {
    const res = await getProducts({
      keyword: kw,
      page: page.value,
      pageSize: 20,
    })
    if (reset) {
      products.value = res.data.list
    } else {
      products.value = [...products.value, ...res.data.list]
    }
    total.value = res.data.total
    if (reset) addSearchHistory(kw)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (products.value.length >= total.value || loading.value) return
  page.value += 1
  loadProducts()
}

function goDetail(product) {
  uni.navigateTo({ url: `/pages/product/detail?id=${product.id}` })
}

onLoad((options) => {
  keyword.value = decodeURIComponent(options.keyword || '')
  loadProducts(true)
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f6f8;
}

.scroll {
  flex: 1;
  height: 0;
}
</style>
