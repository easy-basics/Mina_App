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
              <el-form-item label="状态">
                <el-switch v-model="form.enabled" active-text="上架" inactive-text="下架" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="商品详情" name="detail">
        <p class="section-tip">上传多张详情图，将展示在小程序「商品详情」Tab（支持拖拽排序）</p>
        <div ref="detailImagesRef" class="detail-images detail-images-sortable">
          <div v-for="img in detailImages" :key="img.id" class="image-item">
            <div class="drag-handle-wrap" title="拖拽排序">
              <el-icon><Rank /></el-icon>
            </div>
            <el-image
              :src="resolveMediaUrl(img.url)"
              fit="cover"
              class="detail-img"
              :preview-src-list="detailImages.map((i) => resolveMediaUrl(i.url))"
            />
            <div class="image-actions">
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
        <p class="section-tip">拖拽左侧手柄可调整 SKU 展示顺序</p>
        <div class="toolbar">
          <el-button type="primary" @click="openSkuDialog()">新增 SKU</el-button>
        </div>
        <el-table ref="skuTableRef" :data="skus" border stripe row-key="id">
          <el-table-column width="52" align="center">
            <template #default>
              <el-icon class="drag-handle" title="拖拽排序"><Rank /></el-icon>
            </template>
          </el-table-column>
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

      <el-tab-pane label="二维码" name="qrcode">
        <p class="section-tip">生成小程序码，打印后贴于货架，顾客微信扫码即可打开商品详情页</p>
        <div v-loading="qrcodeLoading" class="qrcode-panel">
          <div class="qrcode-print-card">
            <img v-if="qrcodeUrl" :src="qrcodeUrl" alt="商品小程序码" class="qrcode-img" />
            <div v-else class="qrcode-placeholder">暂无二维码</div>
            <p v-if="product" class="qrcode-product-name">{{ product.name }}</p>
            <p v-if="product" class="qrcode-product-code">货号：{{ product.code }}</p>
            <p class="qrcode-hint">微信扫码查看商品详情</p>
          </div>
          <el-alert
            v-if="qrcodeMock"
            type="warning"
            :closable="false"
            show-icon
            class="qrcode-mock-tip"
            title="当前为开发环境占位码，配置 WECHAT_APPID / WECHAT_SECRET 后将生成可扫码打开小程序的正式码"
          />
          <div class="toolbar qrcode-actions">
            <el-button type="primary" :loading="qrcodeLoading" @click="loadQrcode">刷新二维码</el-button>
            <el-button :disabled="!qrcodeUrl" @click="downloadQrcode">下载图片</el-button>
          </div>
        </div>
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
  createSku,
  updateSku,
  deleteSku,
  sortSkus,
  addDetailImage,
  deleteDetailImage,
  sortDetailImages,
  createParam,
  batchUpdateParams,
  deleteParam,
  addDefaultParams,
  getProductQrcode,
} from '@/api/products'
import { useTableDragSort } from '@/composables/useTableDragSort'
import { getAllCategories } from '@/api/categories'
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
const activeTab = ref('basic')
const formRef = ref()
const skuFormRef = ref()
const paramFormRef = ref()
const paramsTableRef = ref()
const skuTableRef = ref()
const detailImagesRef = ref(null)
let detailImagesSortable = null
const qrcodeUrl = ref('')
const qrcodeMock = ref(false)
const qrcodeLoading = ref(false)
const paramsSortEnabled = computed(() => activeTab.value === 'params')
const skuSortEnabled = computed(() => activeTab.value === 'sku')
const detailSortEnabled = computed(() => activeTab.value === 'detail')
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
  enabled: true,
})

const skuForm = reactive({
  specName: '',
  price: 0,
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
    const [productRes, catRes] = await Promise.all([
      getProduct(productId.value),
      getAllCategories(),
    ])
    product.value = productRes.data
    skus.value = productRes.data.skus || []
    detailImages.value = productRes.data.detailImages || []
    params.value = (productRes.data.params || []).map((p) => ({ ...p }))
    categories.value = catRes.data

    Object.assign(form, {
      categoryId: productRes.data.categoryId,
      code: productRes.data.code,
      name: productRes.data.name,
      enabled: productRes.data.enabled,
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
      sort: product.value?.sort ?? 0,
      enabled: form.enabled,
    })
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

function destroyDetailImagesSortable() {
  detailImagesSortable?.destroy()
  detailImagesSortable = null
}

function initDetailImagesSortable() {
  destroyDetailImagesSortable()
  const el = detailImagesRef.value
  if (!el || detailImages.value.length === 0) return

  detailImagesSortable = Sortable.create(el, {
    animation: 180,
    draggable: '.image-item',
    handle: '.drag-handle-wrap',
    ghostClass: 'drag-row-ghost',
    filter: '.detail-uploader',
    onEnd({ oldIndex, newIndex }) {
      if (oldIndex === newIndex || oldIndex == null || newIndex == null) return
      const list = [...detailImages.value]
      const [moved] = list.splice(oldIndex, 1)
      list.splice(newIndex, 0, moved)
      detailImages.value = list
      const items = list.map((img, i) => ({ id: img.id, sort: i }))
      sortDetailImages(productId.value, items)
        .then(() => {
          detailImages.value = list.map((img, i) => ({ ...img, sort: i }))
          ElMessage.success('排序已更新')
        })
        .catch(() => loadData())
    },
  })
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

useTableDragSort({
  tableRef: paramsTableRef,
  listRef: params,
  enabledRef: paramsSortEnabled,
  onSave: async () => {
    syncParamSortIndex()
    const ok = await saveParams(false)
    if (ok) ElMessage.success('排序已更新')
  },
})

useTableDragSort({
  tableRef: skuTableRef,
  listRef: skus,
  enabledRef: skuSortEnabled,
  onSave: async (items) => {
    await sortSkus(productId.value, items)
    skus.value = skus.value.map((row, i) => ({ ...row, sort: i }))
    ElMessage.success('排序已更新')
  },
})

watch(activeTab, (tab) => {
  if (tab === 'detail') {
    nextTick(() => initDetailImagesSortable())
  } else {
    destroyDetailImagesSortable()
  }
  if (tab === 'qrcode' && !qrcodeUrl.value) {
    loadQrcode()
  }
})

watch(
  () => detailImages.value.map((i) => i.id).join(','),
  () => {
    if (activeTab.value === 'detail') {
      nextTick(() => initDetailImagesSortable())
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
    enabled: row?.enabled ?? true,
  })
  skuDialogVisible.value = true
}

async function handleSkuSubmit() {
  await skuFormRef.value.validate()
  skuSubmitting.value = true
  try {
    const existing = editingSkuId.value
      ? skus.value.find((s) => s.id === editingSkuId.value)
      : null
    const payload = {
      ...skuForm,
      sort: existing?.sort ?? skus.value.length,
    }
    if (editingSkuId.value) {
      await updateSku(productId.value, editingSkuId.value, payload)
      ElMessage.success('SKU 更新成功')
    } else {
      await createSku(productId.value, payload)
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

async function loadQrcode() {
  qrcodeLoading.value = true
  try {
    const res = await getProductQrcode(productId.value)
    qrcodeUrl.value = res.data.qrcode
    qrcodeMock.value = !!res.data.mock
  } finally {
    qrcodeLoading.value = false
  }
}

function downloadQrcode() {
  if (!qrcodeUrl.value || !product.value) return
  const link = document.createElement('a')
  link.href = qrcodeUrl.value
  link.download = `${product.value.code || product.value.name}-qrcode.png`
  link.click()
}

onMounted(async () => {
  await loadData()
  if (activeTab.value === 'detail') {
    nextTick(() => initDetailImagesSortable())
  }
})

onBeforeUnmount(() => {
  destroyDetailImagesSortable()
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
  position: relative;
}

.image-item .drag-handle-wrap {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 2px 6px;
  display: flex;
  align-items: center;
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

.toolbar {
  margin-bottom: 16px;
}

.qrcode-panel {
  max-width: 360px;
}

.qrcode-print-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #fff;
}

.qrcode-img {
  width: 240px;
  height: 240px;
}

.qrcode-placeholder {
  width: 240px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  border-radius: 8px;
}

.qrcode-product-name {
  margin: 16px 0 4px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.qrcode-product-code {
  margin: 0 0 8px;
  color: #606266;
  font-size: 14px;
}

.qrcode-hint {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.qrcode-mock-tip {
  margin-top: 16px;
}

.qrcode-actions {
  margin-top: 16px;
}
</style>
