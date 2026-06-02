<template>
  <view class="page">
    <view class="form-card">
      <view class="form-row">
        <text class="label"><text class="required">*</text>姓名</text>
        <input
          v-model="form.realName"
          class="input"
          placeholder="请输入姓名"
          maxlength="32"
        />
      </view>
      <view class="form-row">
        <text class="label"><text class="required">*</text>手机号</text>
        <view class="phone-row">
          <input
            v-model="form.phone"
            class="input phone-input"
            type="number"
            maxlength="11"
            placeholder="请输入手机号"
          />
          <!-- #ifdef MP-WEIXIN -->
          <button
            id="privacy-agree-btn"
            class="phone-btn"
            plain
            open-type="getPhoneNumber|agreePrivacyAuthorization"
            @getphonenumber="onGetPhone"
            @agreeprivacyauthorization="onAgreePrivacy"
          >
            一键填写
          </button>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <text class="phone-hint">请在微信小程序中使用</text>
          <!-- #endif -->
        </view>
      </view>
      <view class="form-row">
        <text class="label"><text class="required">*</text>公司名</text>
        <input
          v-model="form.companyName"
          class="input"
          placeholder="请输入公司名或品牌名，没有填：无"
          maxlength="128"
        />
      </view>
      <view class="form-row form-row--last">
        <text class="label">公司地址</text>
        <input
          v-model="form.companyAddress"
          class="input"
          placeholder="选填"
          maxlength="255"
        />
      </view>
    </view>

    <button class="save-btn" :loading="saving" @click="save">保存</button>
    <button v-if="userStore.isLoggedIn" class="logout-btn" @click="logout">退出登录</button>
  </view>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { updateProfile, bindPhone } from '@/api/auth'
import { ensureLogin } from '@/utils/request'
import { onAgreePrivacyAuthorization } from '@/utils/wechatPrivacy'

const userStore = useUserStore()
const saving = ref(false)
const dirty = ref(false)

const form = reactive({
  realName: '',
  phone: '',
  companyName: '',
  companyAddress: '',
})

function syncForm() {
  const u = userStore.user || {}
  form.realName = u.realName || ''
  form.phone = u.phone || ''
  form.companyName = u.companyName || ''
  form.companyAddress = u.companyAddress || ''
  dirty.value = false
}

async function load() {
  if (!ensureLogin()) return
  await userStore.fetchProfile()
  syncForm()
}

function validate() {
  if (!form.realName.trim()) {
    uni.showToast({ title: '请填写姓名', icon: 'none' })
    return false
  }
  if (!/^1\d{10}$/.test(form.phone.trim())) {
    uni.showToast({ title: '请填写正确手机号', icon: 'none' })
    return false
  }
  if (!form.companyName.trim()) {
    uni.showToast({ title: '请填写公司名', icon: 'none' })
    return false
  }
  return true
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const res = await updateProfile({
      realName: form.realName.trim(),
      phone: form.phone.trim(),
      companyName: form.companyName.trim(),
      companyAddress: form.companyAddress.trim() || null,
    })
    userStore.patchUser(res.data)
    dirty.value = false
    uni.showToast({ title: '保存成功' })
    setTimeout(() => uni.navigateBack(), 500)
  } finally {
    saving.value = false
  }
}

async function onGetPhone(e) {
  const detail = e.detail || {}
  if (detail.errMsg === 'getPhoneNumber:ok' && detail.code) {
    try {
      const res = await bindPhone(detail.code)
      form.phone = res.data.phone
      if (res.data.user) {
        userStore.patchUser(res.data.user)
      }
      dirty.value = true
    } catch {
      /* request.js handles toast */
    }
    return
  }

  const errMsg = detail.errMsg || ''
  if (errMsg.includes('deny') || errMsg.includes('cancel')) {
    uni.showToast({ title: '已取消授权', icon: 'none' })
    return
  }
  if (errMsg.includes('privacy')) {
    uni.showToast({ title: '请先同意隐私保护指引', icon: 'none' })
    return
  }
  if (errMsg && errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({ title: '获取手机号失败', icon: 'none' })
  }
}

function onAgreePrivacy(e) {
  onAgreePrivacyAuthorization(e)
}

function logout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录？',
    success(res) {
      if (res.confirm) {
        userStore.logout()
        uni.showToast({ title: '已退出' })
        uni.navigateBack()
      }
    },
  })
}

onShow(load)
onMounted(() => {
  syncForm()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 48rpx;
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
}
.label {
  width: 160rpx;
  flex-shrink: 0;
  font-size: 30rpx;
  color: #2d2a3e;
}
.required {
  color: #e53935;
  margin-right: 4rpx;
}
.input {
  flex: 1;
  font-size: 30rpx;
  text-align: right;
  color: #2d2a3e;
}
.phone-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16rpx;
}
.phone-input {
  flex: 1;
  min-width: 0;
}
.phone-btn {
  flex-shrink: 0;
  margin: 0;
  padding: 0 20rpx;
  height: 56rpx;
  line-height: 56rpx;
  font-size: 24rpx;
  color: var(--color-primary);
  background: #fff;
  border: 1rpx solid var(--color-primary);
  border-radius: 8rpx;
}
.phone-btn::after {
  border: none;
}
.phone-hint {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #999;
}
.save-btn {
  margin: 48rpx 32rpx 24rpx;
  background: var(--color-primary);
  color: #fff;
  border-radius: 12rpx;
  font-size: 32rpx;
}
.logout-btn {
  margin: 0 32rpx;
  background: #fff;
  color: #999;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style>
