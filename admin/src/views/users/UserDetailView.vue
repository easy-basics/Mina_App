<template>
  <div v-loading="loading" class="page-card">
    <div class="toolbar">
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <template v-if="user">
      <el-descriptions title="用户资料" :column="2" border>
        <el-descriptions-item label="头像">
          <el-avatar v-if="user.avatar" :src="user.avatar" :size="48" />
          <el-avatar v-else :size="48">{{ (user.nickname || user.realName || '?')[0] }}</el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="昵称">{{ user.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ user.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ user.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公司名">{{ user.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公司地址">{{ user.companyAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatTime(user.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="统计">
          订单 {{ user._count?.orders ?? 0 }} ·
          地址 {{ user._count?.addresses ?? 0 }} ·
          收藏 {{ user._count?.favorites ?? 0 }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">收货地址</el-divider>
      <el-table v-if="user.addresses?.length" :data="user.addresses" border stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column label="省市区" min-width="180">
          <template #default="{ row }">{{ row.province }}{{ row.city }}{{ row.district }}</template>
        </el-table-column>
        <el-table-column prop="detail" label="详细地址" min-width="200" />
        <el-table-column label="默认" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="success" size="small">默认</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无收货地址" />

      <el-divider content-position="left">最近订单</el-divider>
      <el-table v-if="user.orders?.length" :data="user.orders" border stripe>
        <el-table-column label="订单号" min-width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/orders/${row.id}`)">
              {{ row.orderNo }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="门店" width="120">
          <template #default="{ row }">{{ row.store?.name }}</template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">{{ row.orderType === 'sample' ? '布版' : '大货' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag>{{ getStatusLabel(row.orderType, row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无订单" />
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getUser } from '@/api/users'
import { getStatusLabel } from '@/constants/orders'

const route = useRoute()
const userId = Number(route.params.id)

const loading = ref(false)
const user = ref(null)

function formatTime(val) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getUser(userId)
    user.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
