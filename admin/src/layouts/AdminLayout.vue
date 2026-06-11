<template>
  <el-container class="layout-root">
    <el-aside width="220px" class="layout-aside">
      <div class="brand">
        <span class="brand-dot" />
        布行管理后台
      </div>
      <el-menu :default-active="activeMenu" router class="layout-menu">
        <el-menu-item index="/categories">
          <el-icon><Menu /></el-icon>
          <span>系列管理</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-right">
          <span class="username">{{ auth.admin?.username }}</span>
          <el-button type="danger" link @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Menu, Goods, User, List } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const activeMenu = computed(() => {
  if (route.path.startsWith('/products')) return '/products'
  if (route.path.startsWith('/users')) return '/users'
  if (route.path.startsWith('/orders')) return '/orders'
  return route.path
})

const pageTitle = computed(() => route.meta.title || '管理后台')

async function handleLogout() {
  await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-root {
  height: 100vh;
}

.layout-aside {
  background: linear-gradient(180deg, #2a2450 0%, var(--app-sidebar-bg) 100%);
  color: #fff;
  box-shadow: 2px 0 12px rgba(123, 97, 255, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 60px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  letter-spacing: 0.02em;
}

.brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-primary);
  box-shadow: 0 0 10px var(--app-primary);
}

.layout-menu {
  border-right: none;
  background: transparent;
}

.layout-menu:not(.el-menu--collapse) {
  width: 220px;
}

:deep(.layout-menu .el-menu-item) {
  color: var(--app-sidebar-text);
  margin: 4px 10px;
  border-radius: 8px;
  height: 44px;
}

:deep(.layout-menu .el-menu-item.is-active) {
  color: #fff;
  background: var(--app-sidebar-active) !important;
  box-shadow: 0 4px 12px rgba(123, 97, 255, 0.35);
}

:deep(.layout-menu .el-menu-item:hover) {
  color: #fff;
  background: rgba(123, 97, 255, 0.25) !important;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #ebe8f5;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d2a3e;
}

.header-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  margin-right: 10px;
  vertical-align: -3px;
  border-radius: 2px;
  background: var(--app-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  color: #6b6680;
}

.layout-main {
  padding: 20px;
  background: var(--app-page-bg);
}
</style>
