<template>
  <div class="page-card">
    <div class="toolbar">
      <div class="toolbar-left">
        <template v-if="!sortMode">
          <el-input
            v-model="query.keyword"
            placeholder="搜索门店名称/联系人/电话"
            clearable
            style="width: 260px"
            @clear="loadData"
            @keyup.enter="loadData"
          />
          <el-button type="primary" @click="loadData">查询</el-button>
        </template>
        <p v-else class="sort-mode-tip">拖拽左侧手柄调整顺序，松手后自动保存</p>
      </div>
      <div>
        <template v-if="sortMode">
          <el-button @click="exitSortMode">完成排序</el-button>
        </template>
        <template v-else>
          <el-button @click="enterSortMode">排序</el-button>
          <el-button type="primary" @click="openDialog()">新增门店</el-button>
        </template>
      </div>
    </div>

    <el-table ref="tableRef" v-loading="loading" :data="list" border stripe row-key="id">
      <el-table-column v-if="sortMode" width="52" align="center">
        <template #default>
          <el-icon class="drag-handle" title="拖拽排序"><Rank /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="门店名称" min-width="140" />
      <el-table-column prop="contact" label="联系人" width="100" />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="!sortMode" label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && list.length === 0" description="暂无门店数据" />

    <div v-if="!sortMode" class="pager">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
        @size-change="loadData"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑门店' : '新增门店'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Rank } from '@element-plus/icons-vue'
import {
  getStores,
  getStoreSortList,
  sortStores,
  createStore,
  updateStore,
  deleteStore,
} from '@/api/stores'
import { useTableDragSort } from '@/composables/useTableDragSort'

const loading = ref(false)
const submitting = ref(false)
const sortMode = ref(false)
const list = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const tableRef = ref()

const query = reactive({ page: 1, pageSize: 20, keyword: '' })
const form = reactive({
  name: '',
  contact: '',
  phone: '',
  address: '',
  enabled: true,
})

const rules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const res = await getStores(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function loadSortList() {
  loading.value = true
  try {
    const res = await getStoreSortList()
    list.value = res.data
  } finally {
    loading.value = false
  }
}

async function enterSortMode() {
  sortMode.value = true
  await loadSortList()
  nextTick(() => dragSort.init())
}

function exitSortMode() {
  sortMode.value = false
  dragSort.destroy()
  loadData()
}

const dragSort = useTableDragSort({
  tableRef,
  listRef: list,
  enabledRef: sortMode,
  onSave: async (items) => {
    await sortStores(items)
    list.value = list.value.map((row, i) => ({ ...row, sort: i }))
    ElMessage.success('排序已更新')
  },
})

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, {
    name: row?.name || '',
    contact: row?.contact || '',
    phone: row?.phone || '',
    address: row?.address || '',
    enabled: row?.enabled ?? true,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) {
      await updateStore(editingId.value, form)
      ElMessage.success('更新成功')
    } else {
      await createStore({ ...form, sort: 0 })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除门店「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteStore(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
