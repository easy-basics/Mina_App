<template>
  <view class="product-card" @click="emit('click', product)">
    <image
      :src="product.coverImage || '/static/logo.svg'"
      class="cover"
      mode="aspectFill"
    />
    <text class="name">{{ displayName }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  product: { type: Object, required: true },
})

const emit = defineEmits(['click'])

const displayName = computed(() => {
  const { code = '', name = '' } = props.product
  return `${code}${name}`
})
</script>

<style scoped>
.product-card {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.cover {
  width: 100%;
  height: 340rpx;
  background: #eee;
  display: block;
}

.name {
  display: block;
  padding: 16rpx 12rpx 20rpx;
  font-size: 26rpx;
  color: #333;
  line-height: 1.4;
}
</style>
