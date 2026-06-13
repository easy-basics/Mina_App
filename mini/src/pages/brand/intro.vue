<template>
  <scroll-view scroll-y class="page">
    <image class="hero" :src="heroSrc" mode="aspectFill" />
    <view class="content">
      <text class="brand-name">{{ brandName }}</text>
      <text class="brand-sub">{{ brandSubtitle }}</text>

      <view v-for="(section, index) in sections" :key="index" class="section">
        <text class="section-title">{{ section.title }}</text>
        <view v-if="section.tags?.length" class="tags">
          <text v-for="tag in section.tags" :key="tag" class="tag">{{ tag }}</text>
        </view>
        <text class="section-body">{{ section.body }}</text>
      </view>

      <button class="back-btn" @click="goHome">返回首页</button>
    </view>
    <view class="page-bottom" />
  </scroll-view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getHomeContent } from '@/api/catalog'
import { resolveImageUrl } from '@/utils/media'

const FALLBACK = {
  hero: '/static/brand/a1.jpg',
  brandName: '才汇纺织',
  brandSubtitle: '广州才汇纺织科技有限公司',
  sections: [
    {
      title: '企业简介',
      body: '广州才汇纺织科技有限公司隶属于广州秀丽服装培训学院旗下一子公司。公司立足粤港澳大湾区，专注纺织面料的研发、生产与销售，为服装企业与设计师提供稳定、优质的面料供应服务。',
      tags: [],
    },
    {
      title: '核心业务',
      tags: ['面料研发', '规模化生产', '全国销售'],
      body: '才汇纺织以面料研发、生产、销售为一体，建立从打样、小批量到大批量供货的完整服务体系，支持布版与大货两种采购模式。',
    },
    {
      title: '产品方向',
      body: '旗下纺织产品涵盖时装面料、工装面料等多个品类，持续拓展功能性、环保型面料产品线，满足不同场景下的穿着与工艺需求。',
      tags: [],
    },
    {
      title: '联系我们',
      body: '欢迎通过小程序浏览选购，或联系客服咨询大货订单与定制需求。',
      tags: [],
    },
  ],
}

const brandData = ref(null)

const heroSrc = computed(() => {
  const url = brandData.value?.introHeroImage
  return url ? resolveImageUrl(url) : FALLBACK.hero
})

const brandName = computed(() => brandData.value?.brandName || FALLBACK.brandName)

const brandSubtitle = computed(() => brandData.value?.brandSubtitle || FALLBACK.brandSubtitle)

const sections = computed(() => {
  const list = brandData.value?.sections
  if (list?.length) return list
  return FALLBACK.sections
})

function goHome() {
  uni.reLaunch({ url: '/pages/home/index' })
}

async function loadBrand() {
  try {
    const res = await getHomeContent()
    brandData.value = res.data?.brand || null
  } catch {
    brandData.value = null
  }
}

onMounted(loadBrand)
</script>

<style scoped>
.page {
  height: 100vh;
  background: #f5f6f8;
}

.hero {
  width: 100%;
  height: 400rpx;
}

.content {
  margin: -40rpx 24rpx 0;
  padding: 40rpx 32rpx;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  position: relative;
}

.brand-name {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
}

.brand-sub {
  display: block;
  font-size: 26rpx;
  color: #888;
  text-align: center;
  margin-top: 8rpx;
  margin-bottom: 40rpx;
}

.section {
  margin-bottom: 36rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid var(--color-primary);
}

.section-body {
  display: block;
  font-size: 28rpx;
  color: #555;
  line-height: 1.75;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tag {
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border-radius: 32rpx;
}

.back-btn {
  margin-top: 24rpx;
  background: var(--color-primary);
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.page-bottom {
  height: 48rpx;
}
</style>
