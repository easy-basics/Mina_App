<template>
  <div class="page-card">
    <div class="toolbar">
      <div class="toolbar-left">
        <template v-if="!sortMode">
          <el-select
            v-model="query.categoryId"
            placeholder="选择系列"
            clearable
            style="width: 180px"
            @change="loadData"
          >
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-input
            v-model="query.keyword"
            placeholder="搜索货号/名称"
            clearable
            style="width: 200px"
            @clear="loadData"
            @keyup.enter="loadData"
          />
          <el-button type="primary" @click="loadData">查询</el-button>
        </template>
        <template v-else>
          <el-select
            v-model="sortCategoryId"
            placeholder="选择要排序的系列"
            style="width: 200px"
            @change="loadSortList"
          >
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <p class="sort-mode-tip">拖拽左侧手柄调整该系列下商品顺序，松手后自动保存</p>
        </template>
      </div>
      <div>
        <template v-if="sortMode">
          <el-button @click="exitSortMode">完成排序</el-button>
        </template>
        <template v-else>
          <el-button @click="enterSortMode">排序</el-button>
          <el-button type="primary" @click="openDialog()">新增商品</el-button>
        </template>
      </div>
    </div>

    <el-table ref="tableRef" v-loading="loading" :data="list" border stripe row-key="id">
      <el-table-column v-if="sortMode" width="52" align="center">
        <template #default>
          <el-icon class="drag-handle" title="拖拽排序"><Rank /></el-icon>
        </template>
      </el-table-column>
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <img v-if="row.coverImage" :src="resolveMediaUrl(row.coverImage)" class="cover-thumb" alt="" />
          <span v-else class="no-cover">无图</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="货号" width="100" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column v-if="!sortMode" label="系列" width="120">
        <template #default="{ row }">{{ row.category?.name }}</template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="SKU数" width="80">
        <template #default="{ row }">{{ row._count?.skus ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="!sortMode" label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push(`/products/${row.id}`)">详情/SKU</el-button>
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && list.length === 0" :description="sortMode ? '该系列暂无商品' : '暂无商品数据'" />

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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑商品' : '新增商品'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="所属系列" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择系列" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="货号" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload :show-file-list="false" :http-request="handleUpload" accept="image/*">
            <img v-if="form.coverImage" :src="resolveMediaUrl(form.coverImage)" class="upload-preview" alt="" />
            <el-button v-else type="primary" plain>上传图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.enabled" active-text="上架" inactive-text="下架" />
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
  getProducts,
  getProductSortList,
  sortProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/api/products'
import { getAllCategories } from '@/api/categories'
import { uploadFile } from '@/api/upload'
import { resolveMediaUrl, toStoredMediaPath } from '@/utils/media'
import { useTableDragSort } from '@/composables/useTableDragSort'

const loading = ref(false)
const submitting = ref(false)
const sortMode = ref(false)
const sortCategoryId = ref(null)
const list = ref([])
const total = ref(0)
const categories = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()
const tableRef = ref()

const query = reactive({ page: 1, pageSize: 20, categoryId: null, keyword: '' })
const form = reactive({
  categoryId: null,
  code: '',
  name: '',
  coverImage: '',
  enabled: true,
})

const rules = {
  categoryId: [{ required: true, message: '请选择系列', trigger: 'change' }],
  code: [{ required: true, message: '请输入货号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

async function loadCategories() {
  const res = await getAllCategories()
  categories.value = res.data
}

async function loadData() {
  loading.value = true
  try {
    const params = { ...query }
    if (!params.categoryId) delete params.categoryId
    if (!params.keyword) delete params.keyword
    const res = await getProducts(params)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function loadSortList() {
  if (!sortCategoryId.value) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const res = await getProductSortList(sortCategoryId.value)
    list.value = res.data
    nextTick(() => dragSort.init())
  } finally {
    loading.value = false
  }
}

async function enterSortMode() {
  if (!categories.value.length) {
    await loadCategories()
  }
  sortCategoryId.value = query.categoryId || categories.value[0]?.id || null
  if (!sortCategoryId.value) {
    ElMessage.warning('请先创建系列')
    return
  }
  sortMode.value = true
  await loadSortList()
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
    await sortProducts(sortCategoryId.value, items)
    list.value = list.value.map((row, i) => ({ ...row, sort: i }))
    ElMessage.success('排序已更新')
  },
})

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, {
    categoryId: row?.categoryId || null,
    code: row?.code || '',
    name: row?.name || '',
    coverImage: row?.coverImage || '',
    enabled: row?.enabled ?? true,
  })
  dialogVisible.value = true
}

async function handleUpload({ file }) {
  const res = await uploadFile(file)
  form.coverImage = toStoredMediaPath(res.data.url)
  ElMessage.success('上传成功')
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (editingId.value) {
      await updateProduct(editingId.value, form)
      ElMessage.success('更新成功')
    } else {
      await createProduct({ ...form, sort: 0 })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除商品「${row.code} ${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteProduct(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(async () => {
  await loadCategories()
  await loadData()
})
</script>

<style scoped>
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.no-cover {
  color: #909399;
  font-size: 12px;
}

.upload-preview {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}
</style>
