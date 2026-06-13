<template>
  <view class="page">
    <!-- #ifdef MP-WEIXIN -->
    <view v-if="needPrivacyTip" class="privacy-tip">
      <text class="privacy-tip-text">
        使用「一键填写」前需同意
      </text>
      <text class="privacy-link" @click="openPrivacyContract">《用户隐私保护指引》</text>
      <text class="privacy-tip-text">，请点击右侧按钮并在微信弹窗中选择同意。</text>
    </view>
    <!-- #endif -->

    <view class="avatar-section">
      <!-- #ifdef MP-WEIXIN -->
      <button
        id="privacy-avatar-btn-edit"
        class="avatar-picker"
        open-type="chooseAvatar|agreePrivacyAuthorization"
        hover-class="none"
        :disabled="avatarSaving"
        @chooseavatar="onChooseAvatar"
        @agreeprivacyauthorization="onAgreePrivacy"
      >
        <image class="avatar" :src="avatarSrc" mode="aspectFill" />
      </button>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <image class="avatar" :src="avatarSrc" mode="aspectFill" />
      <!-- #endif -->
      <text class="avatar-hint">{{ avatarSaving ? '上传中…' : '点击选择微信头像' }}</text>
    </view>

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
  </view>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { updateProfile, bindPhone } from '@/api/auth'
import { ensureLogin } from '@/utils/request'
import {
  onAgreePrivacyAuthorization,
  showPrivacyNotDeclaredHelp,
} from '@/utils/wechatPrivacy'
import { useWechatAvatar } from '@/composables/useWechatAvatar'

const userStore = useUserStore()
const saving = ref(false)
const dirty = ref(false)

const {
  avatarSaving,
  needPrivacyTip,
  avatarSrc,
  onChooseAvatar,
  refreshPrivacyTip,
  openPrivacyContract,
} = useWechatAvatar()

function onAgreePrivacy(e) {
  onAgreePrivacyAuthorization(e)
  if (e.detail?.errMsg === 'agreePrivacyAuthorization:ok') {
    needPrivacyTip.value = false
  }
}

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
  await refreshPrivacyTip()
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
  if (errMsg.includes('not declared')) {
    needPrivacyTip.value = true
    showPrivacyNotDeclaredHelp('一键填写手机号')
    return
  }
  if (errMsg.includes('privacy')) {
    needPrivacyTip.value = true
    uni.showModal({
      title: '提示',
      content:
        '请先同意《用户隐私保护指引》：再次点击「一键填写」，在微信弹出的窗口中选择同意；也可先点击下方链接查看指引全文。',
      confirmText: '查看指引',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) openPrivacyContract()
      },
    })
    return
  }
  if (errMsg && errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({ title: '获取手机号失败', icon: 'none' })
  }
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
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx 32rpx;
  background: #fff;
  margin-top: 16rpx;
}
.avatar-picker {
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  line-height: 1;
}
.avatar-picker::after {
  border: none;
}
.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: block;
}
.avatar-hint {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #999;
}
.privacy-tip {
  margin: 16rpx 24rpx 0;
  padding: 20rpx 24rpx;
  background: #fff8f0;
  border-radius: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #666;
}
.privacy-tip-text {
  color: #666;
}
.privacy-link {
  color: var(--color-primary);
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
  margin: 48rpx 32rpx;
  background: var(--color-primary);
  color: #fff;
  border-radius: 12rpx;
  font-size: 32rpx;
}
</style>
