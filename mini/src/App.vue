<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { setupWechatPrivacyListener } from '@/utils/wechatPrivacy'
import { setupUiDebug } from '@/utils/uiDebug'

onLaunch(async () => {
  setupUiDebug()
  setupWechatPrivacyListener()

  const userStore = useUserStore()
  const cartStore = useCartStore()

  try {
    await userStore.silentLogin()
    await userStore.fetchProfile()
  } catch {
    /* 网络异常时保留本地 token，后续请求再重试 */
    userStore.authReady = !!userStore.token
  }

  if (userStore.isLoggedIn) {
    cartStore.refresh()
  }
})
</script>

<style>
@import './uni.css';
</style>
