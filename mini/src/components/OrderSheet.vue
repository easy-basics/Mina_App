<template>
  <view v-if="visible" class="mask" @click="close">
    <view class="sheet" @click.stop>
      <view class="sheet-title">请选择门店</view>
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

      <view class="section-title">板布</view>
      <view class="search-row">
        <input v-model="colorKeyword" class="color-search" placeholder="搜索颜色" />
      </view>
      <scroll-view scroll-y class="sku-list">
        <view v-for="sku in filteredSkus" :key="sku.id" class="sku-row">
          <text class="sku-name">{{ sku.specName }}</text>
          <view class="qty-box">
            <text class="qty-btn" @click="changeQty(sku.id, -1)">-</text>
            <input
              class="qty-input"
              type="number"
              :value="quantities[sku.id] || ''"
              @input="onQtyInput(sku.id, $event)"
            />
            <text class="qty-btn" @click="changeQty(sku.id, 1)">+</text>
          </view>
          <text v-if="orderType === 'sample'" class="price">{{ sku.price }}元/米</text>
          <text v-else class="price">面议</text>
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
        <text class="addr-link" @click="goAddress">管理地址</text>
      </view>

      <button class="confirm-btn" :loading="submitting" @click="submit">确定</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { createOrder, payWechat, mockPaySuccess } from '@/api/order'
import { addToCart } from '@/api/cart'
import { getAddresses } from '@/api/address'
import { ensureLogin } from '@/utils/request'
import { ORDER_TYPES } from '@/constants/orders'
import { useCartStore } from '@/stores/cart'

const props = defineProps({
  visible: Boolean,
  product: Object,
  orderType: { type: String, default: ORDER_TYPES.SAMPLE },
  mode: { type: String, default: 'order' },
})

const emit = defineEmits(['update:visible', 'success'])

const stores = ref([])
const selectedStoreId = ref(null)
const colorKeyword = ref('')
const quantities = ref({})
const deliveryType = ref('pickup')
const addresses = ref([])
const selectedAddressId = ref(null)
const submitting = ref(false)
const cartStore = useCartStore()

const selectedAddress = computed(() =>
  addresses.value.find((a) => a.id === selectedAddressId.value)
)

const filteredSkus = computed(() => {
  const list = props.product?.skus || []
  if (!colorKeyword.value.trim()) return list
  const kw = colorKeyword.value.trim().toLowerCase()
  return list.filter((s) => s.specName.toLowerCase().includes(kw))
})

watch(
  () => props.visible,
  async (v) => {
    if (v && props.product) {
      stores.value = props.product.stores || []
      selectedStoreId.value = stores.value[0]?.id || null
      quantities.value = {}
      colorKeyword.value = ''
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
  }
)

function onAddressPick(e) {
  const idx = Number(e.detail.value)
  selectedAddressId.value = addresses.value[idx]?.id || null
}

function goAddress() {
  uni.navigateTo({ url: '/pages/address/list' })
}

function close() {
  emit('update:visible', false)
}

function changeQty(skuId, delta) {
  const cur = Number(quantities.value[skuId] || 0)
  const next = Math.max(0, cur + delta)
  quantities.value = { ...quantities.value, [skuId]: next || '' }
}

function onQtyInput(skuId, e) {
  const v = parseInt(e.detail.value, 10)
  quantities.value = { ...quantities.value, [skuId]: isNaN(v) ? '' : v }
}

async function submit() {
  if (!ensureLogin()) return
  const items = Object.entries(quantities.value)
    .filter(([, q]) => Number(q) > 0)
    .map(([skuId, q]) => ({ skuId: Number(skuId), quantity: Number(q) }))
  if (!items.length) {
    uni.showToast({ title: '请选择数量', icon: 'none' })
    return
  }

  if (props.mode === 'cart') {
    submitting.value = true
    try {
      for (const item of items) {
        await addToCart({
          skuId: item.skuId,
          quantity: item.quantity,
          orderType: props.orderType,
        })
      }
      close()
      cartStore.refresh()
      uni.showToast({ title: '已加入购物车' })
      emit('success')
    } finally {
      submitting.value = false
    }
    return
  }

  if (!selectedStoreId.value) {
    uni.showToast({ title: '请选择门店', icon: 'none' })
    return
  }
  if (
    props.orderType === ORDER_TYPES.SAMPLE &&
    deliveryType.value === 'express' &&
    !selectedAddressId.value
  ) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const res = await createOrder({
      orderType: props.orderType,
      storeId: selectedStoreId.value,
      items,
      deliveryType: props.orderType === ORDER_TYPES.SAMPLE ? deliveryType.value : undefined,
      addressId:
        props.orderType === ORDER_TYPES.SAMPLE && deliveryType.value === 'express'
          ? selectedAddressId.value
          : undefined,
      remark: '',
    })
    const order = res.data
    close()
    emit('success', order)

    if (props.orderType === ORDER_TYPES.SAMPLE) {
      try {
        const payRes = await payWechat(order.id)
        const payment = payRes.data.payment
        if (payment.mock) {
          await mockPaySuccess(order.id)
          uni.showToast({ title: '支付成功(模拟)' })
        } else {
          await new Promise((resolve, reject) => {
            uni.requestPayment({
              ...payment,
              success: resolve,
              fail: reject,
            })
          })
        }
      } catch (e) {
        uni.showModal({
          title: '订单已创建',
          content: '支付未完成，可在我的订单中继续支付',
          showCancel: false,
        })
      }
    } else {
      uni.showToast({ title: '已提交，客服将联系您' })
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
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  box-sizing: border-box;
}
.sheet-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.store-row {
  white-space: nowrap;
  margin-bottom: 24rpx;
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
  border-color: #e53935;
  color: #e53935;
}
.section-title {
  font-size: 28rpx;
  margin-bottom: 12rpx;
}
.color-search {
  background: #f5f5f5;
  border-radius: 32rpx;
  padding: 12rpx 20rpx;
  font-size: 26rpx;
  margin-bottom: 16rpx;
}
.sku-list {
  max-height: 400rpx;
}
.sku-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.sku-name {
  flex: 1;
  font-size: 26rpx;
}
.qty-box {
  display: flex;
  align-items: center;
  margin: 0 16rpx;
}
.qty-btn {
  width: 48rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8rpx;
}
.qty-input {
  width: 72rpx;
  text-align: center;
  font-size: 26rpx;
}
.price {
  font-size: 24rpx;
  color: #e53935;
  min-width: 120rpx;
  text-align: right;
}
.delivery-row {
  display: flex;
  gap: 24rpx;
  margin: 20rpx 0;
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
  margin-bottom: 8rpx;
}
.addr-link {
  font-size: 24rpx;
  color: #7b61ff;
  display: block;
  margin-bottom: 12rpx;
}
.confirm-btn {
  background: #e53935;
  color: #fff;
  border-radius: 8rpx;
  margin-top: 16rpx;
}
</style>
