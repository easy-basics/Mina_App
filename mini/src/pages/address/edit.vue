<template>
  <view class="page">
    <view class="form">
      <input v-model="form.name" placeholder="收货人" class="input" />
      <input v-model="form.phone" placeholder="手机号" class="input" />
      <input v-model="form.province" placeholder="省" class="input" />
      <input v-model="form.city" placeholder="市" class="input" />
      <input v-model="form.district" placeholder="区" class="input" />
      <input v-model="form.detail" placeholder="详细地址" class="input" />
      <label class="switch-row">
        <text>设为默认</text>
        <switch :checked="form.isDefault" @change="form.isDefault = $event.detail.value" />
      </label>
    </view>
    <button class="save-btn" @click="save">保存</button>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAddresses, createAddress, updateAddress } from '@/api/address'

const id = ref(0)
const form = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
})

onLoad((q) => {
  id.value = Number(q.id || 0)
})

async function load() {
  if (!id.value) return
  const res = await getAddresses()
  const a = res.data.find((x) => x.id === id.value)
  if (a) Object.assign(form, a)
}

async function save() {
  if (id.value) {
    await updateAddress(id.value, form)
  } else {
    await createAddress(form)
  }
  uni.showToast({ title: '保存成功' })
  uni.navigateBack()
}

onMounted(load)
</script>

<style scoped>
.form {
  background: #fff;
  margin: 16rpx;
  padding: 16rpx;
  border-radius: 12rpx;
}
.input {
  border-bottom: 1rpx solid #eee;
  padding: 24rpx 8rpx;
  font-size: 28rpx;
}
.switch-row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 8rpx;
  align-items: center;
}
.save-btn {
  margin: 32rpx;
  background: var(--color-primary);
  color: #fff;
}
</style>
