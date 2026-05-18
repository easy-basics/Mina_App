<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

onLaunch(() => {
  const userStore = useUserStore()
  const cartStore = useCartStore()
  if (userStore.isLoggedIn) {
    cartStore.refresh()
  }
})
</script>

<style>
@import './uni.css';
</style>
