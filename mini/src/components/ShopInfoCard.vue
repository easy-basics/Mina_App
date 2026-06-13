<template>
  <view v-if="shop" class="shop-card">
    <image
      :src="coverSrc"
      class="shop-cover"
      mode="aspectFill"
    />
    <view class="shop-body">
      <view class="shop-header">
        <text class="shop-name">{{ shop.name }}</text>
        <view class="shop-actions">
          <view v-if="shop.address" class="action-btn" @click.stop="openMap">
            <image class="action-icon" :src="mapIcon" mode="aspectFit" />
          </view>
          <view v-if="shop.phone" class="action-btn" @click.stop="callPhone">
            <image class="action-icon" :src="phoneIcon" mode="aspectFit" />
          </view>
        </view>
      </view>
      <text v-if="shop.address" class="shop-row">{{ shop.address }}</text>
      <text v-if="shop.phone" class="shop-row">{{ shop.phone }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { resolveImageUrl } from '@/utils/media'
import mapIcon from '../../assets/svg/map.svg'
import phoneIcon from '../../assets/svg/phone.svg'

const props = defineProps({
  shop: { type: Object, default: null },
})

const coverSrc = computed(() =>
  resolveImageUrl(props.shop?.coverImage, '/static/logo.svg')
)

function openMap() {
  const { shop } = props
  if (!shop?.address) return

  const latitude = Number(shop.latitude)
  const longitude = Number(shop.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    uni.showToast({ title: '暂未配置地图坐标', icon: 'none' })
    return
  }

  uni.openLocation({
    latitude,
    longitude,
    name: shop.name || '门店',
    address: shop.address,
    scale: 16,
  })
}

function callPhone() {
  const phone = props.shop?.phone?.trim()
  if (!phone) return
  uni.makePhoneCall({ phoneNumber: phone })
}
</script>

<style scoped>
.shop-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  width: 100%;
  margin: 0;
  padding: 18rpx 24rpx;
  background: #fff;
  border-radius: 0;
  box-sizing: border-box;
}

.shop-cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: #edf0f2;
  flex-shrink: 0;
}

.shop-body {
  flex: 1;
  min-width: 0;
}

.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.shop-name {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: #2f2f2f;
  line-height: 1.35;
}

.shop-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
}

.action-icon {
  width: 40rpx;
  height: 40rpx;
  display: block;
}

.shop-row {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #6c6c6c;
  line-height: 1.4;
  word-break: break-all;
}
</style>
