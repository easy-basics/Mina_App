<template>
  <div class="page-card">
    <div class="toolbar">
      <div class="toolbar-left">
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
      </div>
      <el-button type="primary" @click="openDialog()">新增商品</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border stripe>
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <img v-if="row.coverImage" :src="resolveMediaUrl(row.coverImage)" class="cover-thumb" alt="" />
          <span v-else class="no-cover">无图</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="货号" width="100" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column label="系列" width="120">
        <template #default="{ row }">{{ row.category?.name }}</template>
      </el-table-column>
      <el-table-column label="SKU数" width="80">
        <template #default="{ row }">{{ row._count?.skus ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push(`/products/${row.id}`)">详情/SKU</el-button>
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && list.length === 0" description="暂无商品数据" />

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
          <el-upload
            :show-file-list="false"
            :http-request="handleUpload"
            accept="image/*"
          >
            <img v-if="form.coverImage" :src="resolveMediaUrl(form.coverImage)" class="upload-preview" alt="" />
            <el-button v-else type="primary" plain>上传图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/products'
import { getAllCategories } from '@/api/categories'
import { uploadFile } from '@/api/upload'
import { resolveMediaUrl, toStoredMediaPath } from '@/utils/media'

const loading = ref(false)
const submitting = ref(false)
const list = ref([])
const total = ref(0)
const categories = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const formRef = ref()

const query = reactive({ page: 1, pageSize: 20, categoryId: null, keyword: '' })
const form = reactive({
  categoryId: null,
  code: '',
  name: '',
  coverImage: '',
  sort: 0,
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

function openDialog(row) {
  editingId.value = row?.id || null
  Object.assign(form, {
    categoryId: row?.categoryId || null,
    code: row?.code || '',
    name: row?.name || '',
    coverImage: row?.coverImage || '',
    sort: row?.sort ?? 0,
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
      await createProduct(form)
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
