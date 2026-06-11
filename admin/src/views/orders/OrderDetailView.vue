<template>
  <div v-loading="loading" class="page-card">
    <div class="toolbar">
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <template v-if="order">
      <el-descriptions title="订单信息" :column="2" border>
        <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          {{ order.orderType === 'sample' ? '布版' : '大货' }}
        </el-descriptions-item>
        <el-descriptions-item label="自提信息" :span="2">
          <template v-if="order.deliveryType === 'pickup' && order.pickup">
            {{ order.pickup.name }}
            <span v-if="order.pickup.address"> · {{ order.pickup.address }}</span>
            <span v-if="order.pickup.phone"> · {{ order.pickup.phone }}</span>
          </template>
          <template v-else>-</template>
        </el-descriptions-item>
        <el-descriptions-item label="客户">
          {{ order.customerName || '-' }} {{ order.customerPhone || '' }}
        </el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ order.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="支付">
          {{ PAY_STATUS_LABELS[order.payStatus] || order.payStatus }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ order.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="status-row">
        <span>订单状态：</span>
        <el-select v-model="selectedStatus" style="width: 160px">
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-button type="primary" :loading="statusSaving" @click="handleStatusChange">更新状态</el-button>
      </div>

      <el-divider content-position="left">订单明细</el-divider>
      <el-table :data="order.items" border stripe>
        <el-table-column prop="specName" label="规格" />
        <el-table-column label="数量" width="100">
          <template #default="{ row }">{{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="单价" width="100">
          <template #default="{ row }">¥{{ row.unitPrice }}</template>
        </el-table-column>
        <el-table-column label="小计" width="100">
          <template #default="{ row }">
            ¥{{ (Number(row.quantity) * Number(row.unitPrice)).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">跟进记录</el-divider>
      <div class="log-form">
        <el-input
          v-model="logContent"
          type="textarea"
          :rows="3"
          placeholder="输入跟进备注"
        />
        <el-button type="primary" :loading="logSaving" style="margin-top: 12px" @click="handleAddLog">
          添加备注
        </el-button>
      </div>

      <el-timeline v-if="order.logs?.length" class="log-timeline">
        <el-timeline-item
          v-for="log in order.logs"
          :key="log.id"
          :timestamp="formatTime(log.createdAt)"
          placement="top"
        >
          <p>{{ log.content }}</p>
          <p v-if="log.admin" class="log-admin">— {{ log.admin.username }}</p>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无跟进记录" />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrder, updateOrderStatus, addOrderLog } from '@/api/orders'
import {
  PAY_STATUS_LABELS,
  getStatusOptions,
} from '@/constants/orders'

const route = useRoute()
const orderId = Number(route.params.id)

const loading = ref(false)
const order = ref(null)
const selectedStatus = ref('')
const logContent = ref('')
const statusSaving = ref(false)
const logSaving = ref(false)

const statusOptions = computed(() =>
  order.value ? getStatusOptions(order.value.orderType) : []
)

function formatTime(val) {
  return new Date(val).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const res = await getOrder(orderId)
    order.value = res.data
    selectedStatus.value = res.data.status
  } finally {
    loading.value = false
  }
}

async function handleStatusChange() {
  statusSaving.value = true
  try {
    await updateOrderStatus(orderId, selectedStatus.value)
    ElMessage.success('状态已更新')
    loadData()
  } finally {
    statusSaving.value = false
  }
}

async function handleAddLog() {
  if (!logContent.value.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }
  logSaving.value = true
  try {
    await addOrderLog(orderId, logContent.value.trim())
    ElMessage.success('备注已添加')
    logContent.value = ''
    loadData()
  } finally {
    logSaving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}

.log-form {
  margin-bottom: 24px;
}

.log-timeline {
  margin-top: 16px;
}

.log-admin {
  color: #909399;
  font-size: 12px;
  margin: 4px 0 0;
}
</style>
