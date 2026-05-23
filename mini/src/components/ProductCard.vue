<template>
  <view class="product-card" @click="emit('click', product)">
    <image
      :src="coverSrc"
      class="cover"
      mode="aspectFill"
    />
    <text class="name">{{ displayName }}</text>
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
