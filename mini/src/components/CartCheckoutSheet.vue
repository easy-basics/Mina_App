<template>
  <view v-if="visible" class="mask" @click="close">
    <view class="sheet" @click.stop>
      <view class="sheet-title">选择门店结算</view>
      <scroll-view scroll-x class="store-row">
        <view
          v-for="s in stores"
          :key="s.id"
          class="store-chip"
          :class="{ active: s.id === selectedStoreId }"
          @click="selectedStoreId = s.id"
        >
          {{ s.name }}
        </view>
      </scroll-view>
      <view v-if="orderType === 'sample'" class="delivery-row">
        <text
          class="delivery-opt"
          :class="{ active: deliveryType === 'pickup' }"
          @click="deliveryType = 'pickup'"
        >自提</text>
        <text
          class="delivery-opt"
          :class="{ active: deliveryType === 'express' }"
          @click="deliveryType = 'express'"
        >邮寄</text>
      </view>
      <view v-if="orderType === 'sample' && deliveryType === 'express'" class="addr-row">
        <picker :range="addresses" range-key="label" @change="onAddressPick">
          <view class="addr-pick">
            {{ selectedAddress ? selectedAddress.label : '请选择收货地址' }}
          </view>
        </picker>
      </view>
      <text class="hint">将为本门店可售商品各创建一笔订单</text>
      <button class="confirm-btn" :loading="submitting" @click="submit">确认结算</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getStores } from '@/api/catalog'
import { getAddresses } from '@/api/address'
import { createOrder, payWechat, mockPaySuccess } from '@/api/order'
import { ensureLogin } from '@/utils/request'
import { ORDER_TYPES } from '@/constants/orders'
import { useCartStore } from '@/stores/cart'

const props = defineProps({
  visible: Boolean,
  items: { type: Array, default: () => [] },
  orderType: { type: String, default: ORDER_TYPES.SAMPLE },
  productStoreMap: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:visible', 'success'])

const stores = ref([])
const selectedStoreId = ref(null)
const deliveryType = ref('pickup')
const addresses = ref([])
const selectedAddressId = ref(null)
const submitting = ref(false)
const cartStore = useCartStore()

const selectedAddress = computed(() =>
  addresses.value.find((a) => a.id === selectedAddressId.value)
)

const eligibleItems = computed(() => {
  if (!selectedStoreId.value) return []
  return props.items.filter((item) => {
    const storeIds = props.productStoreMap[item.product.id] || []
    return storeIds.includes(selectedStoreId.value)
  })
})

watch(
  () => props.visible,
  async (v) => {
    if (!v) return
    const storeRes = await getStores()
    stores.value = storeRes.data
    selectedStoreId.value = stores.value[0]?.id || null
    deliveryType.value = 'pickup'
    selectedAddressId.value = null
    if (props.orderType === ORDER_TYPES.SAMPLE) {
      try {
        const addrRes = await getAddresses()
        addresses.value = (addrRes.data || []).map((a) => ({
          ...a,
          label: `${a.name} ${a.phone} ${a.province}${a.city}${a.district}${a.detail}`,
        }))
        const def = addresses.value.find((a) => a.isDefault)
        selectedAddressId.value = def?.id || addresses.value[0]?.id || null
      } catch {
        addresses.value = []
      }
    }
  }
)

function onAddressPick(e) {
  const idx = Number(e.detail.value)
  selectedAddressId.value = addresses.value[idx]?.id || null
}

function close() {
  emit('update:visible', false)
}

async function submit() {
  if (!ensureLogin()) return
  if (!selectedStoreId.value) {
    uni.showToast({ title: '请选择门店', icon: 'none' })
    return
  }
  if (!eligibleItems.value.length) {
    uni.showToast({ title: '该门店无可结算商品', icon: 'none' })
    return
  }
  if (props.orderType === ORDER_TYPES.SAMPLE && deliveryType.value === 'express' && !selectedAddressId.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const res = await createOrder({
      orderType: props.orderType,
      storeId: selectedStoreId.value,
      items: eligibleItems.value.map((i) => ({
        skuId: i.skuId,
        quantity: i.quantity,
      })),
      deliveryType: props.orderType === ORDER_TYPES.SAMPLE ? deliveryType.value : undefined,
      addressId: deliveryType.value === 'express' ? selectedAddressId.value : undefined,
      clearCartSkuIds: eligibleItems.value.map((i) => i.skuId),
    })
    const order = res.data
    close()
    emit('success')

    if (props.orderType === ORDER_TYPES.SAMPLE) {
      try {
        const payRes = await payWechat(order.id)
        const payment = payRes.data.payment
        if (payment.mock) {
          await mockPaySuccess(order.id)
          uni.showToast({ title: '支付成功(模拟)' })
        } else {
          await new Promise((resolve, reject) => {
            uni.requestPayment({ ...payment, success: resolve, fail: reject })
          })
        }
      } catch {
        uni.showModal({
          title: '订单已创建',
          content: '支付未完成，可在我的订单中继续支付',
          showCancel: false,
        })
      }
    } else {
      uni.showToast({ title: '大货订单已提交' })
    }
    cartStore.refresh()
    uni.navigateTo({ url: `/pages/order/detail?id=${order.id}` })
  } finally {
    submitting.value = false
  }
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
  padding: 24rpx;
}
.sheet-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.store-row {
  white-space: nowrap;
  margin-bottom: 16rpx;
}
.store-chip {
  display: inline-block;
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
  border: 1rpx solid #ddd;
  border-radius: 32rpx;
  font-size: 26rpx;
}
.store-chip.active {
  border-color: #7b61ff;
  color: #7b61ff;
}
.delivery-row {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}
.delivery-opt {
  padding: 8rpx 24rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 26rpx;
}
.delivery-opt.active {
  border-color: #7b61ff;
  color: #7b61ff;
}
.addr-pick {
  padding: 16rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
  margin-bottom: 16rpx;
}
.hint {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 16rpx;
}
.confirm-btn {
  background: #7b61ff;
  color: #fff;
}
</style>
