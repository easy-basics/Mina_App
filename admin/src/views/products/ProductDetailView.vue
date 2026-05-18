<template>
  <div v-loading="loading" class="page-card">
    <div class="toolbar">
      <el-button @click="$router.back()">返回</el-button>
      <el-button type="primary" :loading="saving" @click="saveBasic">保存基本信息</el-button>
    </div>

    <el-tabs v-model="activeTab" class="product-tabs">
      <el-tab-pane label="基本信息" name="basic">
        <el-form v-if="product" ref="formRef" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="货号" prop="code">
                <el-input v-model="form.code" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="名称" prop="name">
                <el-input v-model="form.name" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属系列" prop="categoryId">
                <el-select v-model="form.categoryId" style="width: 100%">
                  <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关联门店">
                <el-select v-model="form.storeIds" multiple placeholder="选择可售门店" style="width: 100%">
                  <el-option v-for="s in stores" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排序">
                <el-input-number v-model="form.sort" :min="0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态">
                <el-switch v-model="form.enabled" active-text="上架" inactive-text="下架" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="商品详情" name="detail">
        <p class="section-tip">上传多张详情图，将展示在小程序「商品详情」Tab（支持拖拽排序）</p>
        <div class="detail-images">
          <div v-for="(img, index) in detailImages" :key="img.id" class="image-item">
            <el-image
              :src="resolveMediaUrl(img.url)"
              fit="cover"
              class="detail-img"
              :preview-src-list="detailImages.map((i) => resolveMediaUrl(i.url))"
            />
            <div class="image-actions">
              <el-button size="small" :disabled="index === 0" @click="moveImage(index, -1)">左移</el-button>
              <el-button size="small" :disabled="index === detailImages.length - 1" @click="moveImage(index, 1)">
                右移
              </el-button>
              <el-button size="small" type="danger" @click="handleDeleteImage(img)">删除</el-button>
            </div>
          </div>
          <el-upload
            class="detail-uploader"
            :show-file-list="false"
            :http-request="handleUploadDetail"
            accept="image/*"
            :disabled="imageUploading"
          >
            <div class="upload-trigger">
              <el-icon v-if="!imageUploading"><Plus /></el-icon>
              <span v-else>上传中...</span>
              <span v-if="!imageUploading" class="upload-text">添加图片</span>
            </div>
          </el-upload>
        </div>
        <el-empty v-if="detailImages.length === 0" description="暂无详情图，请上传" />
      </el-tab-pane>

      <el-tab-pane label="商品参数" name="params">
        <p class="section-tip">参数将展示在小程序「商品参数」Tab；拖拽左侧手柄可调整顺序，编辑后请点击保存参数</p>
        <div class="toolbar">
          <el-button type="primary" @click="openParamDialog()">添加参数</el-button>
          <el-button @click="handleAddDefaults">补全默认参数</el-button>
          <el-button type="primary" plain :loading="paramsSaving" @click="() => saveParams()">保存参数</el-button>
        </div>
        <el-table
          ref="paramsTableRef"
          :data="params"
          row-key="id"
          border
          stripe
          class="params-table"
        >
          <el-table-column width="52" align="center" class-name="drag-col">
            <template #default>
              <el-icon class="drag-handle" title="拖拽排序"><Rank /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="参数名" width="160">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="如 幅宽" />
            </template>
          </el-table-column>
          <el-table-column label="参数值" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.value" placeholder="如 150cm" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" @click="handleDeleteParam(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="params.length === 0" description="暂无参数" />
      </el-tab-pane>

      <el-tab-pane label="SKU 规格" name="sku">
        <div class="toolbar">
          <el-button type="primary" @click="openSkuDialog()">新增 SKU</el-button>
        </div>
        <el-table :data="skus" border stripe>
          <el-table-column prop="specName" label="规格名称" min-width="140" />
          <el-table-column label="单价(元/米)" width="120">
            <template #default="{ row }">{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="primary" @click="openSkuDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDeleteSku(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="skus.length === 0" description="暂无 SKU，请添加颜色规格" />
      </el-tab-pane>
    </el-tabs>

    <!-- SKU 弹窗 -->
    <el-dialog v-model="skuDialogVisible" :title="editingSkuId ? '编辑 SKU' : '新增 SKU'" width="480px">
      <el-form ref="skuFormRef" :model="skuForm" :rules="skuRules" label-width="100px">
        <el-form-item label="规格名称" prop="specName">
          <el-input v-model="skuForm.specName" placeholder="如 1#米黄" />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="skuForm.price" :min="0" :precision="2" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="skuForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="skuForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="skuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="skuSubmitting" @click="handleSkuSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 参数弹窗 -->
    <el-dialog v-model="paramDialogVisible" title="添加参数" width="480px">
      <el-form ref="paramFormRef" :model="paramForm" :rules="paramRules" label-width="90px">
        <el-form-item label="参数名" prop="name">
          <el-input v-model="paramForm.name" placeholder="如 幅宽" />
        </el-form-item>
        <el-form-item label="参数值">
          <el-input v-model="paramForm.value" placeholder="如 150cm" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paramDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paramSubmitting" @click="handleParamSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Rank } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import {
  getProduct,
  updateProduct,
  updateProductStores,
  createSku,
  updateSku,
  deleteSku,
  addDetailImage,
  deleteDetailImage,
  sortDetailImages,
  createParam,
  batchUpdateParams,
  deleteParam,
  addDefaultParams,
} from '@/api/products'
import { getAllCategories } from '@/api/categories'
import { getAllStores } from '@/api/stores'
import { uploadFile } from '@/api/upload'
import { resolveMediaUrl, toStoredMediaPath } from '@/utils/media'

const route = useRoute()
const productId = computed(() => Number(route.params.id))

const loading = ref(false)
const saving = ref(false)
const product = ref(null)
const skus = ref([])
const detailImages = ref([])
const params = ref([])
const categories = ref([])
const stores = ref([])
const activeTab = ref('basic')
const formRef = ref()
const skuFormRef = ref()
const paramFormRef = ref()
const paramsTableRef = ref()
let paramsSortable = null
const skuDialogVisible = ref(false)
const paramDialogVisible = ref(false)
const editingSkuId = ref(null)
const skuSubmitting = ref(false)
const paramSubmitting = ref(false)
const paramsSaving = ref(false)
const imageUploading = ref(false)

const form = reactive({
  categoryId: null,
  code: '',
  name: '',
  sort: 0,
  enabled: true,
  storeIds: [],
})

const skuForm = reactive({
  specName: '',
  price: 0,
  sort: 0,
  enabled: true,
})

const paramForm = reactive({
  name: '',
  value: '',
})

const rules = {
  code: [{ required: true, message: '请输入货号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择系列', trigger: 'change' }],
}

const skuRules = {
  specName: [{ required: true, message: '请输入规格名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
}

const paramRules = {
  name: [{ required: true, message: '请输入参数名', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const [productRes, catRes, storeRes] = await Promise.all([
      getProduct(productId.value),
      getAllCategories(),
      getAllStores(),
    ])
    product.value = productRes.data
    skus.value = productRes.data.skus || []
    detailImages.value = productRes.data.detailImages || []
    params.value = (productRes.data.params || []).map((p) => ({ ...p }))
    categories.value = catRes.data
    stores.value = storeRes.data

    Object.assign(form, {
      categoryId: productRes.data.categoryId,
      code: productRes.data.code,
      name: productRes.data.name,
      sort: productRes.data.sort,
      enabled: productRes.data.enabled,
      storeIds: productRes.data.storeIds || [],
    })
  } finally {
    loading.value = false
  }
}

async function saveBasic() {
  await formRef.value.validate()
  saving.value = true
  try {
    await updateProduct(productId.value, {
      categoryId: form.categoryId,
      code: form.code,
      name: form.name,
      sort: form.sort,
      enabled: form.enabled,
    })
    await updateProductStores(productId.value, form.storeIds)
    ElMessage.success('保存成功')
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleUploadDetail({ file }) {
  imageUploading.value = true
  try {
    const res = await uploadFile(file)
    await addDetailImage(productId.value, { url: toStoredMediaPath(res.data.url) })
    ElMessage.success('上传成功')
    loadData()
  } finally {
    imageUploading.value = false
  }
}

async function handleDeleteImage(img) {
  await ElMessageBox.confirm('确定删除该详情图吗？', '提示', { type: 'warning' })
  await deleteDetailImage(productId.value, img.id)
  ElMessage.success('已删除')
  loadData()
}

async function moveImage(index, delta) {
  const list = [...detailImages.value]
  const target = index + delta
  if (target < 0 || target >= list.length) return
  ;[list[index], list[target]] = [list[target], list[index]]
  const items = list.map((img, i) => ({ id: img.id, sort: i }))
  await sortDetailImages(productId.value, items)
  detailImages.value = list.map((img, i) => ({ ...img, sort: i }))
}

function syncParamSortIndex() {
  params.value.forEach((p, i) => {
    p.sort = i
  })
}

function getParamsPayload() {
  return params.value.map((p, i) => ({
    id: p.id,
    name: p.name.trim(),
    value: (p.value ?? '').trim(),
    sort: i,
  }))
}

async function saveParams(showMessage = true) {
  if (params.value.some((p) => !p.name?.trim())) {
    ElMessage.warning('参数名不能为空')
    return false
  }
  paramsSaving.value = true
  try {
    syncParamSortIndex()
    await batchUpdateParams(productId.value, getParamsPayload())
    if (showMessage) {
      ElMessage.success('参数已保存')
      loadData()
    }
    return true
  } finally {
    paramsSaving.value = false
  }
}

function destroyParamsSortable() {
  paramsSortable?.destroy()
  paramsSortable = null
}

function initParamsSortable() {
  destroyParamsSortable()
  const tbody = paramsTableRef.value?.$el?.querySelector('.el-table__body-wrapper tbody')
  if (!tbody || params.value.length === 0) return

  paramsSortable = Sortable.create(tbody, {
    animation: 180,
    handle: '.drag-handle',
    ghostClass: 'params-row-ghost',
    chosenClass: 'params-row-chosen',
    onEnd({ oldIndex, newIndex }) {
      if (oldIndex === newIndex || oldIndex == null || newIndex == null) return
      const list = [...params.value]
      const [moved] = list.splice(oldIndex, 1)
      list.splice(newIndex, 0, moved)
      params.value = list
      syncParamSortIndex()
      saveParams(false).then((ok) => {
        if (ok) ElMessage.success('排序已更新')
      })
    },
  })
}

watch(activeTab, (tab) => {
  if (tab === 'params') {
    nextTick(() => initParamsSortable())
  } else {
    destroyParamsSortable()
  }
})

watch(
  () => params.value.map((p) => p.id).join(','),
  () => {
    if (activeTab.value === 'params') {
      nextTick(() => initParamsSortable())
    }
  }
)

function openParamDialog() {
  paramForm.name = ''
  paramForm.value = ''
  paramDialogVisible.value = true
}

async function handleParamSubmit() {
  await paramFormRef.value.validate()
  paramSubmitting.value = true
  try {
    await createParam(productId.value, { ...paramForm })
    ElMessage.success('添加成功')
    paramDialogVisible.value = false
    loadData()
  } finally {
    paramSubmitting.value = false
  }
}

async function handleDeleteParam(row) {
  await ElMessageBox.confirm(`确定删除参数「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteParam(productId.value, row.id)
  ElMessage.success('已删除')
  loadData()
}

async function handleAddDefaults() {
  const res = await addDefaultParams(productId.value)
  params.value = res.data.map((p) => ({ ...p }))
  ElMessage.success(res.message || '已补全')
}

function openSkuDialog(row) {
  editingSkuId.value = row?.id || null
  Object.assign(skuForm, {
    specName: row?.specName || '',
    price: row?.price ?? 0,
    sort: row?.sort ?? 0,
    enabled: row?.enabled ?? true,
  })
  skuDialogVisible.value = true
}

async function handleSkuSubmit() {
  await skuFormRef.value.validate()
  skuSubmitting.value = true
  try {
    if (editingSkuId.value) {
      await updateSku(productId.value, editingSkuId.value, skuForm)
      ElMessage.success('SKU 更新成功')
    } else {
      await createSku(productId.value, skuForm)
      ElMessage.success('SKU 创建成功')
    }
    skuDialogVisible.value = false
    loadData()
  } finally {
    skuSubmitting.value = false
  }
}

async function handleDeleteSku(row) {
  await ElMessageBox.confirm(`确定删除 SKU「${row.specName}」吗？`, '提示', { type: 'warning' })
  await deleteSku(productId.value, row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(async () => {
  await loadData()
  if (activeTab.value === 'params') {
    nextTick(() => initParamsSortable())
  }
})

onBeforeUnmount(() => {
  destroyParamsSortable()
})
</script>

<style scoped>
.product-tabs {
  margin-top: 8px;
}

.section-tip {
  margin: 0 0 16px;
  color: #909399;
  font-size: 13px;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.image-item {
  width: 148px;
}

.detail-img {
  width: 148px;
  height: 148px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.detail-uploader :deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  width: 148px;
  height: 148px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-uploader :deep(.el-upload:hover) {
  border-color: var(--app-primary);
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #8c939d;
  font-size: 24px;
}

.upload-text {
  font-size: 12px;
  margin-top: 8px;
}

.params-table {
  max-width: 720px;
}

:deep(.params-table .drag-handle) {
  cursor: grab;
  color: #909399;
  font-size: 18px;
}

:deep(.params-table .drag-handle:active) {
  cursor: grabbing;
}

:deep(.params-row-ghost) {
  opacity: 0.5;
  background: var(--app-primary-bg, #f3f0ff) !important;
}

:deep(.params-row-chosen) {
  background: var(--app-primary-bg, #f3f0ff) !important;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
