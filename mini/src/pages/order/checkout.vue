<template>
  <view v-if="draft" class="page">
    <view v-if="draft.source === 'cart'" class="card">
      <text class="section-title">选择门店</text>
      <scroll-view scroll-x class="store-row">
        <view
          v-for="s in stores"
          :key="s.id"
          class="store-chip"
          :class="{ active: s.id === selectedStoreId }"
          @click="selectStore(s)"
        >
          {{ s.name }}
        </view>
      </scroll-view>
    </view>

    <view v-if="isSample" class="card">
      <text class="section-title">配送方式</text>
      <view class="delivery-row">
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
      <view v-if="deliveryType === 'pickup' && selectedStore" class="pickup-info">
        <text class="pickup-name">{{ selectedStore.name }}</text>
        <text v-if="selectedStore.address" class="pickup-meta">{{ selectedStore.address }}</text>
        <text v-if="selectedStore.phone" class="pickup-meta">{{ selectedStore.phone }}</text>
      </view>
      <view v-if="deliveryType === 'express'" class="addr-row">
        <picker :range="addresses" range-key="label" @change="onAddressPick">
          <view class="addr-pick">
            {{ selectedAddress ? selectedAddress.label : '请选择收货地址' }}
          </view>
        </picker>
        <text class="addr-link" @click="goAddress">管理地址</text>
      </view>
    </view>

    <view class="card">
      <text class="section-title">商品明细</text>
      <view v-for="(item, idx) in displayItems" :key="idx" class="item-row">
        <view class="item-info">
          <text v-if="item.productCode || item.productName" class="item-product">
            {{ item.productCode }}{{ item.productName }}
          </text>
          <text class="item-spec">{{ item.specName }} x {{ item.quantity }}</text>
        </view>
        <text v-if="isSample" class="item-price">¥{{ lineTotal(item) }}</text>
        <text v-else class="item-price">面议</text>
      </view>
      <view v-if="!displayItems.length" class="empty-hint">该门店无可结算商品</view>
    </view>

    <view class="card">
      <text class="section-title">订单备注</text>
      <textarea
        v-model="remark"
        class="remark-input"
        placeholder="选填，可填写您的需求"
        maxlength="200"
      />
    </view>

    <view class="footer-bar">
      <view class="total-wrap">
        <text class="total-label">合计</text>
        <text v-if="isSample" class="total-amount">¥{{ totalAmount }}</text>
        <text v-else class="total-amount">面议</text>
      </view>
      <button class="submit-btn" :loading="submitting" :disabled="!canSubmit" @click="submit">
        提交订单
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { createOrder } from '@/api/order'
import { getStores } from '@/api/catalog'
import { getAddresses } from '@/api/address'
import { ensureLogin } from '@/utils/request'
import { ORDER_TYPES } from '@/constants/orders'
import { useCheckoutStore } from '@/stores/checkout'
import { useCartStore } from '@/stores/cart'
import { useSessionStore } from '@/stores/session'
import { paySampleOrder, showPayIncompleteModal, showPayErrorModal } from '@/utils/payOrder'

const checkoutStore = useCheckoutStore()
const cartStore = useCartStore()
const sessionStore = useSessionStore()

const draft = ref(null)
const stores = ref([])
const selectedStoreId = ref(null)
const deliveryType = ref('pickup')
const addresses = ref([])
const selectedAddressId = ref(null)
const remark = ref('')
const submitting = ref(false)

const isSample = computed(() => draft.value?.orderType === ORDER_TYPES.SAMPLE)

const selectedStore = computed(() =>
  stores.value.find((s) => s.id === selectedStoreId.value) || draft.value?.store
)

const selectedAddress = computed(() =>
  addresses.value.find((a) => a.id === selectedAddressId.value)
)

const displayItems = computed(() => {
  if (!draft.value) return []
  if (draft.value.source !== 'cart') return draft.value.items || []
  if (!selectedStoreId.value) return []
  const map = checkoutStore.productStoreMap
  return (draft.value.items || []).filter((item) => {
    const storeIds = map[item.productId] || []
    return storeIds.includes(selectedStoreId.value)
  })
})

const totalAmount = computed(() => {
  const sum = displayItems.value.reduce(
    (acc, item) => acc + Number(item.unitPrice) * Number(item.quantity),
    0
  )
  return sum.toFixed(2)
})

const canSubmit = computed(() => {
  if (!displayItems.value.length) return false
  if (draft.value?.source === 'cart' && !selectedStoreId.value) return false
  if (isSample.value && deliveryType.value === 'express' && !selectedAddressId.value) return false
  return true
})

function lineTotal(item) {
  return (Number(item.unitPrice) * Number(item.quantity)).toFixed(2)
}

function selectStore(store) {
  selectedStoreId.value = store.id
  sessionStore.setStore(store)
}

function onAddressPick(e) {
  const idx = Number(e.detail.value)
  selectedAddressId.value = addresses.value[idx]?.id || null
}

function goAddress() {
  uni.navigateTo({ url: '/pages/address/list' })
}

async function loadAddresses() {
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

function initFromDraft() {
  const d = checkoutStore.getDraft()
  if (!d) {
    uni.navigateBack()
    return
  }
  draft.value = d
  selectedStoreId.value = d.storeId || null
  remark.value = ''
  deliveryType.value = 'pickup'
}

async function loadStoresForCart() {
  const storeRes = await getStores()
  stores.value = storeRes.data || []
  const sessionId = sessionStore.selectedStore?.id
  const inList = stores.value.some((s) => s.id === sessionId)
  if (!selectedStoreId.value) {
    selectedStoreId.value = inList ? sessionId : stores.value[0]?.id || null
  }
  if (selectedStoreId.value) {
    const current = stores.value.find((s) => s.id === selectedStoreId.value)
    if (current) sessionStore.setStore(current)
  }
}

onMounted(async () => {
  if (!ensureLogin()) return
  initFromDraft()
  if (!draft.value) return

  if (draft.value.source === 'cart') {
    await loadStoresForCart()
  } else if (draft.value.store) {
    stores.value = [draft.value.store]
  }

  if (isSample.value) {
    await loadAddresses()
  }
})

onShow(() => {
  if (isSample.value && draft.value) {
    loadAddresses()
  }
})

async function submit() {
  if (!ensureLogin() || !draft.value || !canSubmit.value) return

  if (isSample.value && deliveryType.value === 'express' && !selectedAddressId.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' })
    return
  }

  const storeId = draft.value.source === 'cart' ? selectedStoreId.value : draft.value.storeId
  const items = displayItems.value.map((item) => ({
    skuId: item.skuId,
    quantity: item.quantity,
  }))

  submitting.value = true
  try {
    const res = await createOrder({
      orderType: draft.value.orderType,
      storeId,
      items,
      deliveryType: isSample.value ? deliveryType.value : undefined,
      addressId: isSample.value && deliveryType.value === 'express' ? selectedAddressId.value : undefined,
      remark: remark.value.trim(),
      clearCartSkuIds: draft.value.clearCartSkuIds,
    })
    const order = res.data
    checkoutStore.clearDraft()

    if (isSample.value) {
      try {
        await paySampleOrder(order.id)
        uni.showToast({ title: '支付成功' })
      } catch (e) {
        console.error('[checkout] pay failed:', e)
        const msg = e?.message || ''
        if (msg.includes('支付服务未就绪') || msg.includes('微信支付')) {
          await showPayErrorModal(msg)
        } else {
          await showPayIncompleteModal()
        }
      }
    } else {
      uni.showToast({ title: '大货订单已提交' })
    }

    cartStore.refresh()
    uni.redirectTo({ url: `/pages/order/detail?id=${order.id}` })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
}
.card {
  background: #fff;
  margin: 16rpx;
  padding: 24rpx;
  border-radius: 12rpx;
}
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}
.store-row {
  white-space: nowrap;
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
  border-color: var(--color-primary);
  color: var(--color-primary);
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
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.pickup-info {
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 16rpx;
}
.pickup-name {
  font-size: 28rpx;
  font-weight: 600;
  display: block;
}
.pickup-meta {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
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
  color: var(--color-primary);
}
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.item-row:last-child {
  border-bottom: none;
}
.item-info {
  flex: 1;
  margin-right: 16rpx;
}
.item-product {
  font-size: 26rpx;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}
.item-spec {
  font-size: 24rpx;
  color: #666;
}
.item-price {
  font-size: 26rpx;
  color: #e53935;
  flex-shrink: 0;
}
.empty-hint {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 24rpx 0;
}
.remark-input {
  width: 100%;
  min-height: 160rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
}
.total-wrap {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}
.total-label {
  font-size: 26rpx;
  color: #666;
}
.total-amount {
  font-size: 36rpx;
  font-weight: 600;
  color: #e53935;
}
.submit-btn {
  min-width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: var(--color-primary);
  color: #fff;
  font-size: 30rpx;
  border: none;
  border-radius: 999rpx;
  margin: 0;
  padding: 0 32rpx;
}
.submit-btn::after {
  border: none;
}
.submit-btn[disabled] {
  background: #ccc;
}
</style>
