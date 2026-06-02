<template>
  <view v-if="visible" class="mask" @click="close">
    <view class="sheet" @click.stop>
      <text class="sheet-title">请选择</text>
      <view class="options">
        <view class="option" @click="pick(ORDER_TYPES.SAMPLE)">
          <view class="icon-circle sample">
            <view class="icon-sample" />
          </view>
          <text class="option-label">板布下单</text>
        </view>
        <view class="option" @click="pick(ORDER_TYPES.BULK)">
          <view class="icon-circle bulk">
            <view class="icon-bulk" />
          </view>
          <text class="option-label">大货下单</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ORDER_TYPES } from '@/constants/orders'

const props = defineProps({
  visible: Boolean,
})

const emit = defineEmits(['update:visible', 'select'])

function close() {
  emit('update:visible', false)
}

function pick(type) {
  emit('select', type)
  close()
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 24rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.sheet-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 48rpx;
}
.options {
  display: flex;
  justify-content: center;
  gap: 120rpx;
}
.option {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.icon-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-circle.sample {
  background: #e53935;
}
.icon-circle.bulk {
  background: #43a047;
}
.icon-sample {
  width: 56rpx;
  height: 56rpx;
  position: relative;
}
.icon-sample::before {
  content: '';
  position: absolute;
  left: 8rpx;
  top: 12rpx;
  width: 36rpx;
  height: 36rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
}
.icon-sample::after {
  content: '';
  position: absolute;
  right: 4rpx;
  bottom: 4rpx;
  width: 28rpx;
  height: 4rpx;
  background: #fff;
  transform: rotate(-35deg);
  border-radius: 2rpx;
  box-shadow: 8rpx -8rpx 0 0 #fff;
}
.icon-bulk {
  width: 48rpx;
  height: 48rpx;
  position: relative;
}
.icon-bulk::before,
.icon-bulk::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border: 3rpx solid #fff;
  border-radius: 50%;
  background: transparent;
}
.icon-bulk::before {
  width: 44rpx;
  height: 44rpx;
  top: 0;
}
.icon-bulk::after {
  width: 32rpx;
  height: 32rpx;
  top: 10rpx;
  box-shadow: 0 18rpx 0 -2rpx #fff;
}
.option-label {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #333;
}
</style>
