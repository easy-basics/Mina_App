<template>
  <view class="product-card" @click="emit('click', product)">
    <image
      :src="coverSrc"
      class="cover"
      mode="aspectFill"
    />
    <view class="content">
      <text class="name">{{ displayName }}</text>
      <text class="meta">板布：{{ samplePriceText }}</text>
      <text class="meta">大货：面议</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { resolveImageUrl } from '@/utils/media'

const props = defineProps({
  product: { type: Object, required: true },
})

const emit = defineEmits(['click'])

const coverSrc = computed(() =>
  resolveImageUrl(props.product.coverImage, '/static/logo.svg')
)

const displayName = computed(() => {
  const { code = '', name = '' } = props.product
  return `${code}${name}`
})

const samplePriceText = computed(() => {
  const price = props.product.minPrice
  if (price === null || price === undefined || price === '') {
    return '¥ --/米'
  }
  return `¥ ${price}元/米`
})
</script>

<style scoped>
.product-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #fff;
  border-radius: 18rpx;
  padding: 18rpx;
  box-sizing: border-box;
}

.cover {
  width: 168rpx;
  height: 168rpx;
  border-radius: 12rpx;
  background: #edf0f2;
  display: block;
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #2f2f2f;
  line-height: 1.35;
  word-break: break-all;
}

.meta {
  display: block;
  margin-top: 10rpx;
  font-size: 27rpx;
  color: #6c6c6c;
  line-height: 1.35;
}
</style>
