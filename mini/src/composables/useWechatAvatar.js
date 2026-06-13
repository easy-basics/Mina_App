import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { resolveImageUrl } from '@/utils/media'
import { DEFAULT_AVATAR } from '@/config'
import {
  onAgreePrivacyAuthorization,
  getPrivacyNeedAuthorization,
  openPrivacyContract,
  showPrivacyNotDeclaredHelp,
} from '@/utils/wechatPrivacy'

/**
 * 微信 chooseAvatar 选择与上传的共享逻辑。
 * @param {object} [options]
 * @param {string|null} [options.successToast='头像已保存'] 保存成功提示；传 null 则不提示
 * @param {(hadAvatar: boolean) => string|null|undefined} [options.resolveSuccessToast] 按保存前是否有头像决定提示
 */
export function useWechatAvatar(options = {}) {
  const {
    successToast = '头像已保存',
    resolveSuccessToast = null,
  } = options

  const userStore = useUserStore()
  const avatarSaving = ref(false)
  const needPrivacyTip = ref(false)

  const avatarSrc = computed(() =>
    resolveImageUrl(userStore.mineAvatar, DEFAULT_AVATAR)
  )

  async function refreshPrivacyTip() {
    needPrivacyTip.value = await getPrivacyNeedAuthorization()
  }

  function onAgreePrivacy(e) {
    onAgreePrivacyAuthorization(e)
    if (e.detail?.errMsg === 'agreePrivacyAuthorization:ok') {
      needPrivacyTip.value = false
      refreshPrivacyTip()
    }
  }

  function handleChooseAvatarError(errMsg) {
    if (errMsg.includes('not declared')) {
      needPrivacyTip.value = true
      showPrivacyNotDeclaredHelp('选择微信头像')
      return true
    }
    if (errMsg.includes('cancel')) return true
    if (errMsg.includes('privacy')) {
      needPrivacyTip.value = true
      uni.showModal({
        title: '提示',
        content:
          '请先同意《用户隐私保护指引》：再次点击按钮，在微信弹出的窗口中选择同意；也可查看指引全文。',
        confirmText: '查看指引',
        cancelText: '知道了',
        success: (res) => {
          if (res.confirm) openPrivacyContract()
        },
      })
      return true
    }
    if (errMsg && errMsg !== 'chooseAvatar:ok') {
      uni.showToast({ title: '选择头像失败', icon: 'none' })
      return true
    }
    return false
  }

  async function onChooseAvatar(e) {
    const detail = e?.detail || {}
    const errMsg = detail.errMsg || ''

    if (handleChooseAvatarError(errMsg)) return

    const tempPath = detail.avatarUrl
    if (!tempPath) {
      uni.showToast({ title: '未获取到头像，请重试', icon: 'none' })
      return
    }

    const hadAvatar = userStore.hasWechatAvatar
    avatarSaving.value = true
    uni.showLoading({ title: '上传头像', mask: true })
    try {
      await userStore.saveWechatAvatar(tempPath)
      const toast = resolveSuccessToast
        ? resolveSuccessToast(hadAvatar)
        : successToast
      if (toast) {
        uni.showToast({ title: toast })
      }
    } catch {
      /* upload / profile 已提示 */
    } finally {
      uni.hideLoading()
      avatarSaving.value = false
    }
  }

  return {
    avatarSaving,
    needPrivacyTip,
    avatarSrc,
    onChooseAvatar,
    onAgreePrivacy,
    refreshPrivacyTip,
    openPrivacyContract,
  }
}
