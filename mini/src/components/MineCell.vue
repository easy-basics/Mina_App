<template>
  <view class="mine-cell" hover-class="mine-cell--hover" @click="$emit('click')">
    <view class="mine-cell__icon">
      <slot name="icon" />
    </view>
    <text class="mine-cell__title">{{ title }}</text>
    <view v-if="$slots.extra" class="mine-cell__extra">
      <slot name="extra" />
    </view>
    <view v-if="arrow" class="mine-cell__arrow" />
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  arrow: { type: Boolean, default: true },
})
defineEmits(['click'])
</script>

<style scoped>
.mine-cell {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  min-height: 96rpx;
  box-sizing: border-box;
}
.mine-cell--hover {
  background: #fafafa;
}
.mine-cell__icon {
  width: 44rpx;
  height: 44rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mine-cell__title {
  flex: 1;
  font-size: 30rpx;
  color: #2d2a3e;
}
.mine-cell__extra {
  margin-right: 12rpx;
}
.mine-cell__arrow {
  width: 16rpx;
  height: 16rpx;
  border-top: 3rpx solid #ccc;
  border-right: 3rpx solid #ccc;
  transform: rotate(45deg);
  flex-shrink: 0;
}
</style>
