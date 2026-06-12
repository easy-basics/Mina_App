<template>
  <view class="product-grid">
    <view v-for="p in products" :key="p.id" class="grid-item">
      <ProductCard :product="p" @click="emit('select', p)" />
    </view>
  </view>
  <view v-if="!loading && !products.length" class="state">{{ emptyText }}</view>
  <view v-if="loading" class="state">{{ loadingText }}</view>
</template>

<script setup>
import ProductCard from '@/components/ProductCard.vue'

defineProps({
  products: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无商品' },
  loadingText: { type: String, default: '加载中...' },
})

const emit = defineEmits(['select'])
</script>

<style scoped>
.product-grid {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 18rpx 24rpx 28rpx;
}

.grid-item {
  width: 100%;
}

.state {
  text-align: center;
  color: #999;
  padding: 60rpx 24rpx;
  font-size: 28rpx;
}
</style>
