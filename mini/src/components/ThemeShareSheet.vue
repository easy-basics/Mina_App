<template>
  <view v-if="visible" class="mask" @click="close">
    <view class="sheet" @click.stop>
      <button open-type="share" class="sheet-item sheet-btn" @click="onShareFriend">
        发送给好友
      </button>
      <view class="divider" />
      <view class="sheet-item" @click="emit('poster')">生成主题海报</view>
      <view class="sheet-gap" />
      <view class="sheet-item cancel" @click="close">取消</view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'poster'])

function close() {
  emit('update:visible', false)
}

function onShareFriend() {
  close()
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: #f5f5f5;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet-item {
  background: #fff;
  text-align: center;
  padding: 32rpx 24rpx;
  font-size: 32rpx;
  color: #333;
}

.sheet-btn {
  width: 100%;
  border: none;
  border-radius: 0;
  line-height: 1.4;
  font-weight: 400;
}

.sheet-btn::after {
  border: none;
}

.divider {
  height: 1rpx;
  background: #eee;
}

.sheet-gap {
  height: 16rpx;
  background: #f5f5f5;
}

.cancel {
  color: #333;
}
</style>
