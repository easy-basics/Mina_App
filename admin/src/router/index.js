import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/products' },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/categories/CategoryListView.vue'),
        meta: { title: '系列管理' },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/ProductListView.vue'),
        meta: { title: '商品管理' },
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import('@/views/products/ProductDetailView.vue'),
        meta: { title: '商品详情' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserListView.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('@/views/users/UserDetailView.vue'),
        meta: { title: '用户详情' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderListView.vue'),
        meta: { title: '订单管理' },
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetailView.vue'),
        meta: { title: '订单详情' },
      },
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('@/views/shop/ShopSettingsView.vue'),
        meta: { title: '门店设置' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (!requiresAuth) {
    if (auth.isLoggedIn && to.path === '/login') {
      return '/'
    }
    return true
  }

  if (!auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!auth.admin) {
    try {
      await auth.fetchMe()
    } catch {
      auth.clearSession()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  return true
})

export default router
