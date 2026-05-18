<template>
  <div class="page-card">
    <el-tabs v-model="orderType" @tab-change="handleTabChange">
      <el-tab-pane label="布版订单" name="sample" />
      <el-tab-pane label="大货订单" name="bulk" />
    </el-tabs>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-select
          v-model="query.status"
          placeholder="订单状态"
          clearable
          style="width: 140px"
          @change="loadData"
        >
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select
          v-model="query.storeId"
          placeholder="门店"
          clearable
          style="width: 160px"
          @change="loadData"
        >
          <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-input
          v-model="query.keyword"
          placeholder="订单号/客户"
          clearable
          style="width: 180px"
          @keyup.enter="loadData"
        />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="150" />
      <el-table-column label="门店" width="120">
        <template #default="{ row }">{{ row.store?.name }}</template>
      </el-table-column>
      <el-table-column label="客户" width="120">
        <template #default="{ row }">{{ row.customerName || '-' }}</template>
      </el-table-column>
      <el-table-column label="金额" width="100">
        <template #default="{ row }">¥{{ row.totalAmount }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag>{{ getStatusLabel(orderType, row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付" width="90">
        <template #default="{ row }">
          {{ PAY_STATUS_LABELS[row.payStatus] || row.payStatus }}
        </template>
      </el-table-column>
      <el-table-column label="明细数" width="80">
        <template #default="{ row }">{{ row._count?.items ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="下单时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push(`/orders/${row.id}`)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && list.length === 0" description="暂无订单" />

    <div class="pager">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
        @size-change="loadData"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getOrders } from '@/api/orders'
import { getAllStores } from '@/api/stores'
import {
  ORDER_TYPES,
  PAY_STATUS_LABELS,
  getStatusOptions,
  getStatusLabel,
} from '@/constants/orders'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const stores = ref([])
const orderType = ref(ORDER_TYPES.SAMPLE)

const query = reactive({
  page: 1,
  pageSize: 20,
  status: '',
  storeId: null,
  keyword: '',
})

const statusOptions = computed(() => getStatusOptions(orderType.value))

function formatTime(val) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

async function loadStores() {
  const res = await getAllStores()
  stores.value = res.data
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      ...query,
      orderType: orderType.value,
    }
    if (!params.status) delete params.status
    if (!params.storeId) delete params.storeId
    if (!params.keyword) delete params.keyword
    const res = await getOrders(params)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  query.page = 1
  query.status = ''
  loadData()
}

onMounted(async () => {
  await loadStores()
  await loadData()
})
</script>

<style scoped>
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
