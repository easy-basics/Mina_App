const prisma = require('../utils/prisma');
const { toAbsoluteUrl, toRelativeMediaPath } = require('../utils/url');
const { applySortUpdates } = require('../utils/sortBatch');

const BRAND_INTRO_ID = 1;

function assertHomeContentClient() {
  if (!prisma.homeBanner?.findMany) {
    const err = new Error('服务端 Prisma Client 未更新，请执行 npx prisma generate 后重启');
    err.status = 503;
    throw err;
  }
}

function normalizeLinkUrl(linkUrl) {
  if (linkUrl === undefined) return undefined;
  if (linkUrl === null || linkUrl === '') return null;
  const trimmed = String(linkUrl).trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('/pages/') || trimmed.includes('..')) {
    const err = new Error('跳转链接须以 /pages/ 开头的小程序内路径');
    err.status = 400;
    throw err;
  }
  return trimmed;
}

function normalizeMediaField(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return toRelativeMediaPath(String(value).trim());
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags)
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function serializeTags(tags) {
  if (tags === undefined) return undefined;
  if (tags === null || tags === '') return null;
  const list = parseTags(tags);
  return list.length ? list.join(',') : null;
}

function serializeBanner(row) {
  return {
    id: row.id,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    sort: row.sort,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeSection(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: row.tags,
    sort: row.sort,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeBrandIntro(row) {
  return {
    id: row.id,
    homeCoverImage: row.homeCoverImage,
    homeSummary: row.homeSummary,
    introHeroImage: row.introHeroImage,
    brandName: row.brandName,
    brandSubtitle: row.brandSubtitle,
    showIntroButton: row.showIntroButton,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function listBanners() {
  assertHomeContentClient();
  const rows = await prisma.homeBanner.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
  });
  return rows.map(serializeBanner);
}

async function createBanner(data) {
  assertHomeContentClient();
  const imageUrl = normalizeMediaField(data.imageUrl);
  if (!imageUrl) {
    const err = new Error('请上传轮播图');
    err.status = 400;
    throw err;
  }
  const maxSort = await prisma.homeBanner.aggregate({ _max: { sort: true } });
  const row = await prisma.homeBanner.create({
    data: {
      imageUrl,
      linkUrl: normalizeLinkUrl(data.linkUrl ?? null),
      sort: data.sort !== undefined ? Number(data.sort) : (maxSort._max.sort ?? -1) + 1,
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
    },
  });
  return serializeBanner(row);
}

async function updateBanner(id, data) {
  assertHomeContentClient();
  const row = await prisma.homeBanner.update({
    where: { id: Number(id) },
    data: {
      imageUrl: data.imageUrl !== undefined ? normalizeMediaField(data.imageUrl) : undefined,
      linkUrl: data.linkUrl !== undefined ? normalizeLinkUrl(data.linkUrl) : undefined,
      sort: data.sort !== undefined ? Number(data.sort) : undefined,
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : undefined,
    },
  });
  return serializeBanner(row);
}

async function deleteBanner(id) {
  assertHomeContentClient();
  await prisma.homeBanner.delete({ where: { id: Number(id) } });
}

async function sortBanners(items) {
  assertHomeContentClient();
  await applySortUpdates('homeBanner', items);
}

async function getBrandAdmin() {
  assertHomeContentClient();
  let intro = await prisma.brandIntro.findUnique({ where: { id: BRAND_INTRO_ID } });
  if (!intro) {
    intro = await prisma.brandIntro.create({
      data: {
        id: BRAND_INTRO_ID,
        homeSummary: '',
        brandName: '才汇纺织',
        showIntroButton: true,
      },
    });
  }
  const sections = await prisma.brandIntroSection.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
  });
  return {
    intro: serializeBrandIntro(intro),
    sections: sections.map(serializeSection),
  };
}

async function updateBrandIntro(data) {
  assertHomeContentClient();
  await getBrandAdmin();
  const row = await prisma.brandIntro.update({
    where: { id: BRAND_INTRO_ID },
    data: {
      homeCoverImage: data.homeCoverImage !== undefined
        ? normalizeMediaField(data.homeCoverImage)
        : undefined,
      homeSummary: data.homeSummary !== undefined ? String(data.homeSummary).trim() : undefined,
      introHeroImage: data.introHeroImage !== undefined
        ? normalizeMediaField(data.introHeroImage)
        : undefined,
      brandName: data.brandName !== undefined ? String(data.brandName).trim() : undefined,
      brandSubtitle: data.brandSubtitle !== undefined
        ? (data.brandSubtitle ? String(data.brandSubtitle).trim() : null)
        : undefined,
      showIntroButton: data.showIntroButton !== undefined
        ? Boolean(data.showIntroButton)
        : undefined,
    },
  });
  return serializeBrandIntro(row);
}

async function createBrandSection(data) {
  assertHomeContentClient();
  if (!data.title?.trim() || !data.body?.trim()) {
    const err = new Error('段落标题和内容不能为空');
    err.status = 400;
    throw err;
  }
  const maxSort = await prisma.brandIntroSection.aggregate({ _max: { sort: true } });
  const row = await prisma.brandIntroSection.create({
    data: {
      title: data.title.trim(),
      body: data.body.trim(),
      tags: serializeTags(data.tags),
      sort: data.sort !== undefined ? Number(data.sort) : (maxSort._max.sort ?? -1) + 1,
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
    },
  });
  return serializeSection(row);
}

async function updateBrandSection(id, data) {
  assertHomeContentClient();
  const row = await prisma.brandIntroSection.update({
    where: { id: Number(id) },
    data: {
      title: data.title !== undefined ? String(data.title).trim() : undefined,
      body: data.body !== undefined ? String(data.body).trim() : undefined,
      tags: data.tags !== undefined ? serializeTags(data.tags) : undefined,
      sort: data.sort !== undefined ? Number(data.sort) : undefined,
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : undefined,
    },
  });
  return serializeSection(row);
}

async function deleteBrandSection(id) {
  assertHomeContentClient();
  await prisma.brandIntroSection.delete({ where: { id: Number(id) } });
}

async function sortBrandSections(items) {
  assertHomeContentClient();
  await applySortUpdates('brandIntroSection', items);
}

function formatBrandForMini(intro, sections) {
  return {
    homeCoverImage: toAbsoluteUrl(intro.homeCoverImage),
    homeSummary: intro.homeSummary,
    showIntroButton: intro.showIntroButton,
    introHeroImage: toAbsoluteUrl(intro.introHeroImage),
    brandName: intro.brandName,
    brandSubtitle: intro.brandSubtitle,
    sections: sections.map((s) => ({
      title: s.title,
      body: s.body,
      tags: parseTags(s.tags),
    })),
  };
}

async function getHomeContentForMini() {
  assertHomeContentClient();
  const [banners, intro, sections] = await Promise.all([
    prisma.homeBanner.findMany({
      where: { enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    }),
    prisma.brandIntro.findUnique({ where: { id: BRAND_INTRO_ID } }),
    prisma.brandIntroSection.findMany({
      where: { enabled: true },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    }),
  ]);

  return {
    banners: banners.map((b) => ({
      id: b.id,
      imageUrl: toAbsoluteUrl(b.imageUrl),
      linkUrl: b.linkUrl,
    })),
    brand: intro ? formatBrandForMini(intro, sections) : null,
  };
}

module.exports = {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  sortBanners,
  getBrandAdmin,
  updateBrandIntro,
  createBrandSection,
  updateBrandSection,
  deleteBrandSection,
  sortBrandSections,
  getHomeContentForMini,
  parseTags,
};
