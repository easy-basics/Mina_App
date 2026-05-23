<template>
  <view class="page">
    <view class="form-card">
      <view class="form-row">
        <text class="label">收货人</text>
        <input v-model="form.name" placeholder="请输入收货人" class="input" />
      </view>
      <view class="form-row">
        <text class="label">手机号</text>
        <input v-model="form.phone" type="number" maxlength="11" placeholder="请输入手机号" class="input" />
      </view>
      <view class="form-row">
        <text class="label">所在地区</text>
        <picker mode="region" :value="region" class="region-picker" @change="onRegionChange">
          <view class="picker-value" :class="{ placeholder: !regionText }">
            {{ regionText || '请选择省市区' }}
          </view>
        </picker>
      </view>
      <view class="form-row">
        <text class="label">详细地址</text>
        <input v-model="form.detail" placeholder="街道、门牌号等" class="input" />
      </view>
      <view class="form-row form-row--last">
        <text class="label">默认地址</text>
        <switch :checked="form.isDefault" @change="form.isDefault = $event.detail.value" />
      </view>
    </view>
    <button class="save-btn" @click="save">保存</button>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

const region = computed(() => {
  if (!form.province) return []
  return [form.province, form.city, form.district]
})

const regionText = computed(() => {
  if (!form.province) return ''
  return `${form.province} ${form.city} ${form.district}`
})

onLoad((q) => {
  id.value = Number(q.id || 0)
})

function onRegionChange(e) {
  const [province, city, district] = e.detail.value
  form.province = province
  form.city = city
  form.district = district
}

async function load() {
  if (!id.value) return
  const res = await getAddresses()
  const a = res.data.find((x) => x.id === id.value)
  if (a) Object.assign(form, a)
}

async function save() {
  if (!form.name?.trim() || !form.phone?.trim()) {
    uni.showToast({ title: '请填写收货人和手机号', icon: 'none' })
    return
  }
  if (!/^1\d{10}$/.test(form.phone.trim())) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  if (!form.province || !form.city || !form.district) {
    uni.showToast({ title: '请选择所在地区', icon: 'none' })
    return
  }
  if (!form.detail?.trim()) {
    uni.showToast({ title: '请填写详细地址', icon: 'none' })
    return
  }
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
.page {
  min-height: 100vh;
}
.form-card {
  background: #fff;
  margin-top: 16rpx;
}
.form-row {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  min-height: 96rpx;
  box-sizing: border-box;
}
.form-row--last {
  border-bottom: none;
  justify-content: space-between;
}
.label {
  width: 160rpx;
  flex-shrink: 0;
  font-size: 30rpx;
  color: #2d2a3e;
}
.input {
  flex: 1;
  font-size: 30rpx;
  text-align: right;
}
.region-picker {
  flex: 1;
}
.picker-value {
  font-size: 30rpx;
  text-align: right;
  color: #2d2a3e;
}
.picker-value.placeholder {
  color: #999;
}
.save-btn {
  margin: 48rpx 32rpx;
  background: var(--color-primary);
  color: #fff;
  border-radius: 12rpx;
}
</style>
