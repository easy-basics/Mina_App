<template>
  <view v-if="visible" class="mask" @click="close">
    <view class="dialog" @click.stop>
      <view v-if="generating" class="loading">海报生成中...</view>
      <template v-else-if="posterPath">
        <scroll-view scroll-y class="preview-wrap">
          <image class="poster-img" :src="posterPath" mode="widthFix" />
        </scroll-view>
        <button class="save-btn" @click="handleSave">保存到相册</button>
      </template>
      <view v-else class="loading">生成失败，请重试</view>
      <view class="close-btn" @click="close">关闭</view>
    </view>
    <canvas
      id="themePosterCanvas"
      type="2d"
      class="hidden-canvas"
      :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
    />
  </view>
</template>

<script setup>
import { ref, watch, getCurrentInstance, nextTick } from 'vue'
import { generateThemePoster, savePosterToAlbum } from '@/utils/themePoster'

const props = defineProps({
  visible: { type: Boolean, default: false },
  theme: { type: Object, default: null },
})

const emit = defineEmits(['update:visible'])

const instance = getCurrentInstance()
const generating = ref(false)
const posterPath = ref('')
const canvasWidth = ref(750)
const canvasHeight = ref(1200)

watch(
  () => props.visible,
  async (val) => {
    if (val && props.theme) {
      await createPoster()
    } else if (!val) {
      posterPath.value = ''
    }
  }
)

async function createPoster() {
  generating.value = true
  posterPath.value = ''
  try {
    await nextTick()
    const path = await generateThemePoster({
      theme: props.theme,
      canvasId: 'themePosterCanvas',
      instance: instance?.proxy,
    })
    posterPath.value = path
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '海报生成失败', icon: 'none' })
  } finally {
    generating.value = false
  }
}

async function handleSave() {
  if (!posterPath.value) return
  try {
    await savePosterToAlbum(posterPath.value)
    uni.showToast({ title: '已保存到相册' })
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function close() {
  emit('update:visible', false)
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}

.dialog {
  width: 100%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-sizing: border-box;
}

.preview-wrap {
  max-height: 60vh;
}

.poster-img {
  width: 100%;
  display: block;
  border-radius: 8rpx;
}

.loading {
  text-align: center;
  color: #666;
  padding: 80rpx 0;
  font-size: 28rpx;
}

.save-btn {
  margin-top: 24rpx;
  background: var(--color-primary, #ff6633);
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
}

.close-btn {
  margin-top: 20rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
  padding: 12rpx;
}

.hidden-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  opacity: 0;
  pointer-events: none;
}
</style>
