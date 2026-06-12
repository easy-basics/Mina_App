<template>
  <div class="page-card">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :loading="scanning" @click="handleScan">开始扫描</el-button>
        <p v-if="scanned" class="summary">
          无引用 {{ summary.count }} 个，合计 {{ formatSize(summary.totalSize) }}
        </p>
      </div>
      <div v-if="scanned && list.length > 0">
        <el-button @click="toggleSelectAll">{{ allSelected ? '取消全选' : '全选' }}</el-button>
        <el-button type="danger" :disabled="selectedPaths.length === 0" :loading="deleting" @click="handleDelete">
          删除选中 ({{ selectedPaths.length }})
        </el-button>
      </div>
    </div>

    <el-table
      v-if="scanned"
      ref="tableRef"
      v-loading="scanning"
      :data="list"
      border
      stripe
      row-key="path"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column label="预览" width="100">
        <template #default="{ row }">
          <el-image
            :src="resolveMediaUrl(row.path)"
            fit="cover"
            class="thumb"
            @click="openPreview(row.path)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="path" label="路径" min-width="280" show-overflow-tooltip />
      <el-table-column label="大小" width="100">
        <template #default="{ row }">{{ formatSize(row.size) }}</template>
      </el-table-column>
      <el-table-column label="修改时间" width="180">
        <template #default="{ row }">{{ formatTime(row.mtime) }}</template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!scanned" description="点击「开始扫描」查找无引用的图片文件" />
    <el-empty v-else-if="!scanning && list.length === 0" description="未发现无引用图片" />

    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewUrls"
      :z-index="3100"
      teleported
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scanOrphans, deleteOrphans } from '@/api/uploads'
import { resolveMediaUrl } from '@/utils/media'

const scanning = ref(false)
const deleting = ref(false)
const scanned = ref(false)
const list = ref([])
const summary = ref({ count: 0, totalSize: 0 })
const selectedPaths = ref([])
const tableRef = ref()
const previewVisible = ref(false)
const previewUrls = ref([])

const allSelected = computed(
  () => list.value.length > 0 && selectedPaths.value.length === list.value.length
)

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString()
}

function handleSelectionChange(rows) {
  selectedPaths.value = rows.map((row) => row.path)
}

function openPreview(path) {
  previewUrls.value = [resolveMediaUrl(path)]
  previewVisible.value = true
}

function toggleSelectAll() {
  if (!tableRef.value) return
  if (allSelected.value) {
    tableRef.value.clearSelection()
  } else {
    list.value.forEach((row) => tableRef.value.toggleRowSelection(row, true))
  }
}

async function handleScan() {
  scanning.value = true
  try {
    const res = await scanOrphans()
    list.value = res.data.items || []
    summary.value = {
      count: res.data.count ?? list.value.length,
      totalSize: res.data.totalSize ?? 0,
    }
    scanned.value = true
    selectedPaths.value = []
  } finally {
    scanning.value = false
  }
}

async function handleDelete() {
  if (selectedPaths.value.length === 0) return

  await ElMessageBox.confirm(
    `确定删除选中的 ${selectedPaths.value.length} 个文件吗？此操作不可恢复。`,
    '删除确认',
    { type: 'warning' }
  )

  deleting.value = true
  try {
    const res = await deleteOrphans(selectedPaths.value)
    const { deleted = [], skipped = [] } = res.data || {}

    if (deleted.length > 0) {
      ElMessage.success(`已删除 ${deleted.length} 个文件`)
    }
    if (skipped.length > 0) {
      ElMessage.warning(`${skipped.length} 个文件未删除`)
    }

    await handleScan()
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary {
  margin: 0;
  color: #6b6680;
  font-size: 14px;
}

.thumb {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  cursor: zoom-in;
}

:deep(.thumb .el-image__inner) {
  cursor: zoom-in;
}

:deep(.el-table .el-table__cell) {
  position: static;
}
</style>
