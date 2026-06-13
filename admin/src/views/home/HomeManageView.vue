<template>
  <div class="page-card">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="轮播图" name="banners">
        <div class="toolbar">
          <div class="toolbar-left">
            <p v-if="bannerSortMode" class="sort-mode-tip">拖拽左侧手柄调整顺序，松手后自动保存</p>
          </div>
          <div>
            <template v-if="bannerSortMode">
              <el-button @click="exitBannerSortMode">完成排序</el-button>
            </template>
            <template v-else>
              <el-button @click="enterBannerSortMode">排序</el-button>
              <el-button type="primary" @click="openBannerDialog()">新增轮播</el-button>
            </template>
          </div>
        </div>

        <el-table ref="bannerTableRef" v-loading="bannerLoading" :data="banners" border stripe row-key="id">
          <el-table-column v-if="bannerSortMode" width="52" align="center">
            <template #default>
              <el-icon class="drag-handle" title="拖拽排序"><Rank /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="预览" width="120">
            <template #default="{ row }">
              <img :src="resolveMediaUrl(row.imageUrl)" class="thumb-preview" alt="" />
            </template>
          </el-table-column>
          <el-table-column label="跳转链接" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.linkUrl || '（无跳转）' }}
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="!bannerSortMode" label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openBannerDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDeleteBanner(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!bannerLoading && banners.length === 0" description="暂无轮播图" />
      </el-tab-pane>

      <el-tab-pane label="品牌介绍" name="brand">
        <div class="toolbar">
          <el-button type="primary" :loading="brandSaving" @click="handleSaveBrand">保存品牌信息</el-button>
        </div>

        <el-form label-width="130px" class="brand-form">
          <h4 class="form-section-title">首页展示</h4>
          <el-form-item label="封面图">
            <el-upload :show-file-list="false" :http-request="(o) => handleBrandUpload('homeCoverImage', o)" accept="image/*">
              <img v-if="brandForm.homeCoverImage" :src="resolveMediaUrl(brandForm.homeCoverImage)" class="cover-preview" alt="" />
              <el-button v-else type="primary" plain>上传图片</el-button>
            </el-upload>
            <el-button v-if="brandForm.homeCoverImage" link type="danger" @click="brandForm.homeCoverImage = ''">移除</el-button>
          </el-form-item>
          <el-form-item label="摘要文案">
            <el-input v-model="brandForm.homeSummary" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item label="显示简介按钮">
            <el-switch v-model="brandForm.showIntroButton" />
          </el-form-item>

          <h4 class="form-section-title">简介页头部</h4>
          <el-form-item label="顶图">
            <el-upload :show-file-list="false" :http-request="(o) => handleBrandUpload('introHeroImage', o)" accept="image/*">
              <img v-if="brandForm.introHeroImage" :src="resolveMediaUrl(brandForm.introHeroImage)" class="cover-preview" alt="" />
              <el-button v-else type="primary" plain>上传图片</el-button>
            </el-upload>
            <el-button v-if="brandForm.introHeroImage" link type="danger" @click="brandForm.introHeroImage = ''">移除</el-button>
          </el-form-item>
          <el-form-item label="品牌名称">
            <el-input v-model="brandForm.brandName" />
          </el-form-item>
          <el-form-item label="副标题">
            <el-input v-model="brandForm.brandSubtitle" />
          </el-form-item>
        </el-form>

        <div class="toolbar section-toolbar">
          <div class="toolbar-left">
            <h4 class="form-section-title inline">段落区块</h4>
            <p v-if="sectionSortMode" class="sort-mode-tip">拖拽左侧手柄调整顺序</p>
          </div>
          <div>
            <template v-if="sectionSortMode">
              <el-button @click="exitSectionSortMode">完成排序</el-button>
            </template>
            <template v-else>
              <el-button @click="enterSectionSortMode">排序</el-button>
              <el-button type="primary" @click="openSectionDialog()">新增段落</el-button>
            </template>
          </div>
        </div>

        <el-table ref="sectionTableRef" v-loading="brandLoading" :data="sections" border stripe row-key="id">
          <el-table-column v-if="sectionSortMode" width="52" align="center">
            <template #default>
              <el-icon class="drag-handle" title="拖拽排序"><Rank /></el-icon>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" width="140" />
          <el-table-column prop="body" label="内容" min-width="240" show-overflow-tooltip />
          <el-table-column label="标签" width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.tags || '—' }}</template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="!sectionSortMode" label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openSectionDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDeleteSection(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="bannerDialogVisible" :title="bannerEditingId ? '编辑轮播' : '新增轮播'" width="520px">
      <el-form ref="bannerFormRef" :model="bannerForm" :rules="bannerRules" label-width="100px">
        <el-form-item label="轮播图" prop="imageUrl">
          <el-upload :show-file-list="false" :http-request="handleBannerUpload" accept="image/*">
            <img v-if="bannerForm.imageUrl" :src="resolveMediaUrl(bannerForm.imageUrl)" class="cover-preview" alt="" />
            <el-button v-else type="primary" plain>上传图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input
            v-model="bannerForm.linkUrl"
            placeholder="留空则不跳转，如 /pages/product/detail?id=1"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="bannerForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bannerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="bannerSubmitting" @click="handleSubmitBanner">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="sectionDialogVisible" :title="sectionEditingId ? '编辑段落' : '新增段落'" width="560px">
      <el-form ref="sectionFormRef" :model="sectionForm" :rules="sectionRules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="sectionForm.title" />
        </el-form-item>
        <el-form-item label="内容" prop="body">
          <el-input v-model="sectionForm.body" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="sectionForm.tags" placeholder="逗号分隔，如：面料研发,规模化生产" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="sectionForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sectionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="sectionSubmitting" @click="handleSubmitSection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Rank } from '@element-plus/icons-vue'
import {
  getHomeBanners,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
  sortHomeBanners,
  getBrandContent,
  updateBrandContent,
  createBrandSection,
  updateBrandSection,
  deleteBrandSection,
  sortBrandSections,
} from '@/api/home'
import { uploadFile } from '@/api/upload'
import { resolveMediaUrl, toStoredMediaPath } from '@/utils/media'
import { useTableDragSort } from '@/composables/useTableDragSort'

const activeTab = ref('banners')

const bannerLoading = ref(false)
const bannerSortMode = ref(false)
const banners = ref([])
const bannerTableRef = ref()
const bannerDialogVisible = ref(false)
const bannerEditingId = ref(null)
const bannerSubmitting = ref(false)
const bannerFormRef = ref()
const bannerForm = reactive({
  imageUrl: '',
  linkUrl: '',
  enabled: true,
})
const bannerRules = {
  imageUrl: [{ required: true, message: '请上传轮播图', trigger: 'change' }],
}

const brandLoading = ref(false)
const brandSaving = ref(false)
const brandForm = reactive({
  homeCoverImage: '',
  homeSummary: '',
  introHeroImage: '',
  brandName: '',
  brandSubtitle: '',
  showIntroButton: true,
})

const sectionSortMode = ref(false)
const sections = ref([])
const sectionTableRef = ref()
const sectionDialogVisible = ref(false)
const sectionEditingId = ref(null)
const sectionSubmitting = ref(false)
const sectionFormRef = ref()
const sectionForm = reactive({
  title: '',
  body: '',
  tags: '',
  enabled: true,
})
const sectionRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  body: [{ required: true, message: '请输入内容', trigger: 'blur' }],
}

async function loadBanners() {
  bannerLoading.value = true
  try {
    const res = await getHomeBanners()
    banners.value = res.data || []
  } finally {
    bannerLoading.value = false
  }
}

async function loadBrand() {
  brandLoading.value = true
  try {
    const res = await getBrandContent()
    Object.assign(brandForm, {
      homeCoverImage: res.data.intro?.homeCoverImage || '',
      homeSummary: res.data.intro?.homeSummary || '',
      introHeroImage: res.data.intro?.introHeroImage || '',
      brandName: res.data.intro?.brandName || '',
      brandSubtitle: res.data.intro?.brandSubtitle || '',
      showIntroButton: res.data.intro?.showIntroButton ?? true,
    })
    sections.value = res.data.sections || []
  } finally {
    brandLoading.value = false
  }
}

function openBannerDialog(row) {
  bannerEditingId.value = row?.id ?? null
  Object.assign(bannerForm, {
    imageUrl: row?.imageUrl || '',
    linkUrl: row?.linkUrl || '',
    enabled: row?.enabled ?? true,
  })
  bannerDialogVisible.value = true
}

async function handleBannerUpload({ file }) {
  const res = await uploadFile(file)
  bannerForm.imageUrl = toStoredMediaPath(res.data.url)
  ElMessage.success('上传成功')
}

async function handleSubmitBanner() {
  await bannerFormRef.value.validate()
  bannerSubmitting.value = true
  try {
    const payload = {
      imageUrl: bannerForm.imageUrl,
      linkUrl: bannerForm.linkUrl || null,
      enabled: bannerForm.enabled,
    }
    if (bannerEditingId.value) {
      await updateHomeBanner(bannerEditingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createHomeBanner(payload)
      ElMessage.success('创建成功')
    }
    bannerDialogVisible.value = false
    await loadBanners()
  } finally {
    bannerSubmitting.value = false
  }
}

async function handleDeleteBanner(row) {
  await ElMessageBox.confirm('确定删除该轮播图吗？', '提示', { type: 'warning' })
  await deleteHomeBanner(row.id)
  ElMessage.success('删除成功')
  await loadBanners()
}

function enterBannerSortMode() {
  bannerSortMode.value = true
  nextTick(initBannerSortable)
}

function exitBannerSortMode() {
  bannerSortMode.value = false
}

const { init: initBannerSortable } = useTableDragSort({
  tableRef: bannerTableRef,
  listRef: banners,
  enabledRef: bannerSortMode,
  onSave: async (items) => {
    await sortHomeBanners(items)
    ElMessage.success('排序已保存')
    await loadBanners()
  },
})

async function handleBrandUpload(field, { file }) {
  const res = await uploadFile(file)
  brandForm[field] = toStoredMediaPath(res.data.url)
  ElMessage.success('上传成功')
}

async function handleSaveBrand() {
  brandSaving.value = true
  try {
    await updateBrandContent({
      homeCoverImage: brandForm.homeCoverImage || null,
      homeSummary: brandForm.homeSummary,
      introHeroImage: brandForm.introHeroImage || null,
      brandName: brandForm.brandName,
      brandSubtitle: brandForm.brandSubtitle || null,
      showIntroButton: brandForm.showIntroButton,
    })
    ElMessage.success('保存成功')
    await loadBrand()
  } finally {
    brandSaving.value = false
  }
}

function openSectionDialog(row) {
  sectionEditingId.value = row?.id ?? null
  Object.assign(sectionForm, {
    title: row?.title || '',
    body: row?.body || '',
    tags: row?.tags || '',
    enabled: row?.enabled ?? true,
  })
  sectionDialogVisible.value = true
}

async function handleSubmitSection() {
  await sectionFormRef.value.validate()
  sectionSubmitting.value = true
  try {
    const payload = {
      title: sectionForm.title,
      body: sectionForm.body,
      tags: sectionForm.tags || null,
      enabled: sectionForm.enabled,
    }
    if (sectionEditingId.value) {
      await updateBrandSection(sectionEditingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createBrandSection(payload)
      ElMessage.success('创建成功')
    }
    sectionDialogVisible.value = false
    await loadBrand()
  } finally {
    sectionSubmitting.value = false
  }
}

async function handleDeleteSection(row) {
  await ElMessageBox.confirm('确定删除该段落吗？', '提示', { type: 'warning' })
  await deleteBrandSection(row.id)
  ElMessage.success('删除成功')
  await loadBrand()
}

function enterSectionSortMode() {
  sectionSortMode.value = true
  nextTick(initSectionSortable)
}

function exitSectionSortMode() {
  sectionSortMode.value = false
}

const { init: initSectionSortable } = useTableDragSort({
  tableRef: sectionTableRef,
  listRef: sections,
  enabledRef: sectionSortMode,
  onSave: async (items) => {
    await sortBrandSections(items)
    ElMessage.success('排序已保存')
    await loadBrand()
  },
})

onMounted(() => {
  loadBanners()
  loadBrand()
})
</script>

<style scoped>
.sort-mode-tip {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.thumb-preview {
  width: 96px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}

.cover-preview {
  width: 160px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  margin-bottom: 8px;
}

.brand-form {
  max-width: 720px;
  margin-bottom: 24px;
}

.form-section-title {
  margin: 8px 0 16px;
  font-size: 15px;
  color: #303133;
}

.form-section-title.inline {
  margin: 0;
}

.section-toolbar {
  margin-top: 8px;
}
</style>
