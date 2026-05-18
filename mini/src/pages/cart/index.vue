<template>
  <view class="page">
    <view v-if="!userStore.isLoggedIn" class="login-tip">
      <button class="btn-primary" @click="doLogin">微信登录后查看购物车</button>
    </view>
    <view v-else>
      <view v-for="item in items" :key="item.id" class="cart-item">
        <image :src="item.product.coverImage" class="thumb" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ item.product.code }}{{ item.product.name }}</text>
          <text class="spec">{{ item.specName }} · {{ item.orderType === 'sample' ? '布版' : '大货' }}</text>
          <view class="row">
            <text class="price">¥{{ item.price }}/米</text>
            <view class="qty">
              <text @click="updateQty(item, -1)">-</text>
              <text>{{ item.quantity }}</text>
              <text @click="updateQty(item, 1)">+</text>
            </view>
          </view>
        </view>
        <text class="del" @click="remove(item)">删除</text>
      </view>
      <view v-if="!items.length" class="empty">购物车是空的，去逛逛吧</view>
      <view v-if="items.length" class="footer">
        <button
          v-if="sampleItems.length"
          class="btn-sample"
          @click="openCheckout(ORDER_TYPES.SAMPLE)"
        >
          结算布版({{ sampleItems.length }})
        </button>
        <button
          v-if="bulkItems.length"
          class="btn-bulk"
          @click="openCheckout(ORDER_TYPES.BULK)"
        >
          结算大货({{ bulkItems.length }})
        </button>
      </view>
    </view>

    <CartCheckoutSheet
      v-model:visible="checkoutVisible"
      :items="checkoutItems"
      :order-type="checkoutOrderType"
      :product-store-map="productStoreMap"
      @success="onCheckoutSuccess"
    />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { updateCartItem, removeCartItem } from '@/api/cart'
import { getProduct } from '@/api/catalog'
import { ORDER_TYPES } from '@/constants/orders'
import CartCheckoutSheet from '@/components/CartCheckoutSheet.vue'

const userStore = useUserStore()
const cartStore = useCartStore()
const items = computed(() => cartStore.items)
const sampleItems = computed(() => items.value.filter((i) => i.orderType === ORDER_TYPES.SAMPLE))
const bulkItems = computed(() => items.value.filter((i) => i.orderType === ORDER_TYPES.BULK))

const checkoutVisible = ref(false)
const checkoutOrderType = ref(ORDER_TYPES.SAMPLE)
const checkoutItems = ref([])
const productStoreMap = ref({})

onShow(async () => {
  if (userStore.isLoggedIn) {
    await cartStore.refresh()
    await loadProductStores()
  }
})

async function loadProductStores() {
  const productIds = [...new Set(items.value.map((i) => i.product.id))]
  const map = {}
  await Promise.all(
    productIds.map(async (pid) => {
      const res = await getProduct(pid)
      map[pid] = (res.data.stores || []).map((s) => s.id)
    })
  )
  productStoreMap.value = map
}

async function doLogin() {
  await userStore.login()
  await cartStore.refresh()
  await loadProductStores()
}

async function updateQty(item, delta) {
  const qty = Number(item.quantity) + delta
  if (qty <= 0) {
    await removeCartItem(item.id)
  } else {
    await updateCartItem(item.id, { quantity: qty })
  }
  cartStore.refresh()
}

async function remove(item) {
  await removeCartItem(item.id)
  cartStore.refresh()
}

function openCheckout(orderType) {
  checkoutOrderType.value = orderType
  checkoutItems.value =
    orderType === ORDER_TYPES.SAMPLE ? sampleItems.value : bulkItems.value
  checkoutVisible.value = true
}

function onCheckoutSuccess() {
  loadProductStores()
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 140rpx;
}
.login-tip {
  padding: 80rpx 40rpx;
}
.cart-item {
  display: flex;
  background: #fff;
  margin: 16rpx;
  padding: 16rpx;
  border-radius: 12rpx;
}
.thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  background: #eee;
}
.info {
  flex: 1;
  margin-left: 16rpx;
}
.name {
  font-size: 28rpx;
  font-weight: 500;
}
.spec {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
  align-items: center;
}
.price {
  color: #e53935;
  font-size: 26rpx;
}
.qty {
  display: flex;
  gap: 16rpx;
  font-size: 28rpx;
}
.del {
  color: #999;
  font-size: 24rpx;
  padding: 8rpx;
}
.empty {
  text-align: center;
  color: #999;
  padding: 80rpx;
}
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  display: flex;
  gap: 16rpx;
}
.btn-primary,
.btn-sample,
.btn-bulk {
  flex: 1;
  color: #fff;
  font-size: 28rpx;
}
.btn-primary {
  background: #7b61ff;
}
.btn-sample {
  background: #e53935;
}
.btn-bulk {
  background: #43a047;
}
</style>
