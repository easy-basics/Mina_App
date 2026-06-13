<template>
  <div class="page-card">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="query.keyword"
          placeholder="OpenID/昵称/手机/姓名/公司"
          clearable
          style="width: 220px"
          @keyup.enter="loadData"
        />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="头像" width="70">
        <template #default="{ row }">
          <img
            v-if="row.avatar && !failedAvatars[row.id]"
            :src="resolveMediaUrl(row.avatar)"
            class="avatar-thumb"
            alt=""
            @error="markAvatarFailed(row.id)"
          />
          <span v-else class="avatar-fallback">{{ userInitial(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="OpenID" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="openid">{{ row.openid || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="昵称" min-width="100">
        <template #default="{ row }">{{ row.nickname || '-' }}</template>
      </el-table-column>
      <el-table-column label="手机号" width="130">
        <template #default="{ row }">{{ row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="姓名" width="100">
        <template #default="{ row }">{{ row.realName || '-' }}</template>
      </el-table-column>
      <el-table-column label="公司名" min-width="120">
        <template #default="{ row }">{{ row.companyName || '-' }}</template>
      </el-table-column>
      <el-table-column label="订单数" width="80">
        <template #default="{ row }">{{ row._count?.orders ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="注册时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push(`/users/${row.id}`)">详情</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && list.length === 0" description="暂无用户" />

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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteUser, getUsers } from '@/api/users'
import { resolveMediaUrl } from '@/utils/media'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const failedAvatars = ref({})

function userInitial(row) {
  return (row.nickname || row.realName || '?')[0]
}

function markAvatarFailed(id) {
  failedAvatars.value[id] = true
}

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
})

function formatTime(val) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const params = { ...query }
    if (!params.keyword) delete params.keyword
    const res = await getUsers(params)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function userLabel(row) {
  return row.nickname || row.openid || `ID ${row.id}`
}

async function handleDelete(row) {
  await ElMessageBox.confirm(
    `确定删除用户「${userLabel(row)}」吗？将永久删除该用户的所有数据（头像、订单、地址、收藏、购物车等），此操作不可恢复。`,
    '删除确认',
    { type: 'warning' }
  )
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.openid {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
