<template>
  <view class="search-row">
    <view class="search-input-wrap">
      <view class="input-icon" />
      <input
        :value="modelValue"
        class="search-input"
        :placeholder="placeholder"
        confirm-type="search"
        @input="onInput"
        @confirm="emit('search')"
      />
      <view v-if="modelValue && clearable" class="clear-btn" @click="clear">
        <text class="clear-x">×</text>
      </view>
    </view>
    <text v-if="showButton" class="search-btn" @click="emit('search')">{{ buttonText }}</text>
  </view>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '寻找心仪商品' },
  showButton: { type: Boolean, default: true },
  buttonText: { type: String, default: '搜索' },
  clearable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

function onInput(e) {
  emit('update:modelValue', e.detail.value)
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.search-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: #fff;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 20rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
}

.input-icon {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid #bbb;
  border-radius: 50%;
  margin-right: 12rpx;
  flex-shrink: 0;
  position: relative;
  box-sizing: border-box;
}

.input-icon::after {
  content: '';
  position: absolute;
  width: 10rpx;
  height: 3rpx;
  background: #bbb;
  right: -8rpx;
  bottom: -2rpx;
  transform: rotate(45deg);
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  height: 72rpx;
}

.clear-btn {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clear-x {
  color: #fff;
  font-size: 32rpx;
  line-height: 1;
}

.search-btn {
  font-size: 30rpx;
  color: #333;
  flex-shrink: 0;
  padding: 0 8rpx;
}
</style>
