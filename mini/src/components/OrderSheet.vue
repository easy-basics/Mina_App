<template>
  <view v-if="visible" class="mask" @click="close">
    <view class="sheet" @click.stop>
      <view class="sheet-header">
        <text class="sheet-title">{{ sectionLabel }}</text>
        <text class="sheet-close" @click="close">×</text>
      </view>
      <view class="search-row">
        <text class="search-icon">🔍</text>
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

      <view v-if="orderType === 'sample'" class="footer-btns">
        <button class="btn-cart" :loading="addingCart" @click="addCart">加入购物车</button>
        <button class="btn-buy" :disabled="!buyNowTotal" @click="buyNow">
          立即购买{{ buyNowTotal ? ` ¥${buyNowTotal}` : '' }}
        </button>
      </view>
      <button v-else class="btn-bulk" :loading="submitting" @click="submitBulk">
        大货下单（面议）
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { createOrder } from '@/api/order'
import { addToCart } from '@/api/cart'
import { ensureLogin } from '@/utils/request'
import { ORDER_TYPES } from '@/constants/orders'
import { useCartStore } from '@/stores/cart'
import { useCheckoutStore } from '@/stores/checkout'

const props = defineProps({
  visible: Boolean,
  product: Object,
  orderType: { type: String, default: ORDER_TYPES.SAMPLE },
})

const emit = defineEmits(['update:visible', 'success'])

const colorKeyword = ref('')
const quantities = ref({})
const addingCart = ref(false)
const submitting = ref(false)
const cartStore = useCartStore()
const checkoutStore = useCheckoutStore()

const sectionLabel = computed(() =>
  props.orderType === ORDER_TYPES.SAMPLE ? '板布' : '大货'
)

const filteredSkus = computed(() => {
  const list = props.product?.skus || []
  if (!colorKeyword.value.trim()) return list
  const kw = colorKeyword.value.trim().toLowerCase()
  return list.filter((s) => s.specName.toLowerCase().includes(kw))
})

const buyNowTotal = computed(() => {
  if (props.orderType !== ORDER_TYPES.SAMPLE) return 0
  const skuMap = new Map((props.product?.skus || []).map((s) => [s.id, Number(s.price)]))
  let total = 0
  for (const [skuId, q] of Object.entries(quantities.value)) {
    const qty = Number(q)
    const price = skuMap.get(Number(skuId))
    if (qty > 0 && price != null) total += price * qty
  }
  return total > 0 ? total.toFixed(2) : ''
})

watch(
  () => props.visible,
  (v) => {
    if (v && props.product) {
      quantities.value = {}
      colorKeyword.value = ''
    }
  }
)

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

function buildItems() {
  return Object.entries(quantities.value)
    .filter(([, q]) => Number(q) > 0)
    .map(([skuId, q]) => ({ skuId: Number(skuId), quantity: Number(q) }))
}

function validateSelection() {
  const items = buildItems()
  if (!items.length) {
    uni.showToast({ title: '请选择数量', icon: 'none' })
    return null
  }
  return items
}

async function addCart() {
  if (!ensureLogin()) return
  const items = validateSelection()
  if (!items) return

  addingCart.value = true
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
    addingCart.value = false
  }
}

function buyNow() {
  if (!ensureLogin()) return
  const items = validateSelection()
  if (!items) return

  const skuMap = new Map((props.product?.skus || []).map((s) => [s.id, s]))

  checkoutStore.setDraft({
    source: 'product',
    orderType: ORDER_TYPES.SAMPLE,
    items: items.map((item) => {
      const sku = skuMap.get(item.skuId)
      return {
        skuId: item.skuId,
        specName: sku?.specName || '',
        quantity: item.quantity,
        unitPrice: Number(sku?.price || 0),
        productId: props.product.id,
        productName: props.product.name,
        productCode: props.product.code,
      }
    }),
  })

  close()
  uni.navigateTo({ url: '/pages/order/checkout' })
}

async function submitBulk() {
  if (!ensureLogin()) return
  const items = validateSelection()
  if (!items) return

  submitting.value = true
  try {
    const res = await createOrder({
      orderType: ORDER_TYPES.BULK,
      items,
      remark: '',
    })
    close()
    emit('success', res.data)
    uni.showToast({ title: '已提交，客服将联系您' })
    cartStore.refresh()
    uni.navigateTo({ url: `/pages/order/detail?id=${res.data.id}` })
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
  z-index: 1001;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.sheet-title {
  font-size: 30rpx;
  font-weight: 600;
}
.sheet-close {
  font-size: 44rpx;
  color: #999;
  line-height: 1;
  padding: 0 8rpx;
}
.search-row {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 32rpx;
  padding: 0 20rpx;
  margin-bottom: 16rpx;
}
.search-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
  flex-shrink: 0;
}
.color-search {
  flex: 1;
  background: transparent;
  padding: 16rpx 0;
  font-size: 26rpx;
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
  color: #666;
  min-width: 120rpx;
  text-align: right;
}
.footer-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
.btn-cart,
.btn-buy,
.btn-bulk {
  flex: 1;
  border: none;
  border-radius: 999rpx;
  line-height: 88rpx;
  height: 88rpx;
  font-size: 30rpx;
  margin: 0;
  padding: 0;
}
.btn-cart::after,
.btn-buy::after,
.btn-bulk::after {
  border: none;
}
.btn-cart {
  background: #fff;
  color: #e53935;
  border: 1rpx solid #e53935;
}
.btn-buy {
  background: #e53935;
  color: #fff;
}
.btn-buy[disabled] {
  background: #ccc;
  color: #fff;
}
.btn-bulk {
  width: 100%;
  background: #43a047;
  color: #fff;
  margin-top: 16rpx;
}
</style>
