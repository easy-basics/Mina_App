<template>
  <div v-loading="loading" class="page-card">
    <div class="toolbar">
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="shop-form">
      <el-form-item label="门店名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入门店名称" />
      </el-form-item>

      <el-form-item label="门店图片">
        <el-upload :show-file-list="false" :http-request="handleUpload" accept="image/*">
          <img v-if="form.coverImage" :src="resolveMediaUrl(form.coverImage)" class="cover-preview" alt="" />
          <el-button v-else type="primary" plain>上传图片</el-button>
        </el-upload>
        <el-button v-if="form.coverImage" link type="danger" @click="form.coverImage = ''">移除图片</el-button>
      </el-form-item>

      <el-form-item label="地址" prop="address">
        <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入门店地址" />
      </el-form-item>

      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>

      <el-form-item label="纬度">
        <el-input v-model="form.latitude" placeholder="选填，用于小程序打开地图" />
      </el-form-item>

      <el-form-item label="经度">
        <el-input v-model="form.longitude" placeholder="选填，可在腾讯地图拾取坐标" />
      </el-form-item>

      <p class="form-tip">
        坐标可在
        <a href="https://lbs.qq.com/getPoint/" target="_blank" rel="noopener noreferrer">腾讯地图坐标拾取</a>
        查询后填入；未填写时小程序点击地址将提示暂未配置地图坐标。
      </p>
    </el-form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getShopSettings, updateShopSettings } from '@/api/shop'
import { uploadFile } from '@/api/upload'
import { resolveMediaUrl, toStoredMediaPath } from '@/utils/media'

const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const form = reactive({
  name: '',
  coverImage: '',
  address: '',
  phone: '',
  latitude: '',
  longitude: '',
})

const rules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const res = await getShopSettings()
    Object.assign(form, {
      name: res.data.name || '',
      coverImage: res.data.coverImage || '',
      address: res.data.address || '',
      phone: res.data.phone || '',
      latitude: res.data.latitude ?? '',
      longitude: res.data.longitude ?? '',
    })
  } finally {
    loading.value = false
  }
}

async function handleUpload({ file }) {
  const res = await uploadFile(file)
  form.coverImage = toStoredMediaPath(res.data.url)
  ElMessage.success('上传成功')
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    await updateShopSettings({
      name: form.name,
      coverImage: form.coverImage || null,
      address: form.address,
      phone: form.phone,
      latitude: form.latitude === '' ? null : form.latitude,
      longitude: form.longitude === '' ? null : form.longitude,
    })
    ElMessage.success('保存成功')
    await loadData()
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.shop-form {
  max-width: 640px;
}

.cover-preview {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  margin-bottom: 8px;
}

.form-tip {
  margin: 0 0 0 110px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.form-tip a {
  color: var(--el-color-primary);
}
</style>
