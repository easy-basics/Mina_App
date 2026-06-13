const path = require('path');
const fs = require('fs');
const { saveUploadedImageFromFile } = require('../../src/services/uploadImageService');

const API_ROOT = path.join(__dirname, '../..');

const DEFAULT_HOME_SUMMARY =
  '广州才汇纺织科技有限公司隶属于广州秀丽服装培训学院旗下一子公司。才汇纺织以面料研发、生产、销售为一体，旗下纺织产品有时装面料、工装面料等。';

const DEFAULT_SECTIONS = [
  {
    title: '企业简介',
    body: '广州才汇纺织科技有限公司隶属于广州秀丽服装培训学院旗下一子公司。公司立足粤港澳大湾区，专注纺织面料的研发、生产与销售，为服装企业与设计师提供稳定、优质的面料供应服务。',
    tags: null,
    sort: 0,
  },
  {
    title: '核心业务',
    body: '才汇纺织以面料研发、生产、销售为一体，建立从打样、小批量到大批量供货的完整服务体系，支持布版与大货两种采购模式。',
    tags: '面料研发,规模化生产,全国销售',
    sort: 1,
  },
  {
    title: '产品方向',
    body: '旗下纺织产品涵盖时装面料、工装面料等多个品类，持续拓展功能性、环保型面料产品线，满足不同场景下的穿着与工艺需求。',
    tags: null,
    sort: 2,
  },
  {
    title: '联系我们',
    body: '欢迎通过小程序浏览选购，或联系客服咨询大货订单与定制需求。',
    tags: null,
    sort: 3,
  },
];

async function resolveStaticImage(relPath) {
  const abs = path.resolve(API_ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  const { url } = await saveUploadedImageFromFile(abs, path.extname(abs) || '.jpg');
  return url;
}

function assertHomeContentClient(prisma) {
  if (!prisma.homeBanner?.count) {
    const err = new Error(
      'Prisma Client 未包含首页内容模型（homeBanner 等）。请先执行: npx prisma generate，再重新运行 seed'
    );
    err.code = 'PRISMA_CLIENT_STALE';
    throw err;
  }
}

async function seedHomeContent(prisma) {
  // #region agent log
  fetch('http://127.0.0.1:7330/ingest/418692a6-e25a-4dfd-af5a-2582b4c9bc43', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'dc28fe' },
    body: JSON.stringify({
      sessionId: 'dc28fe',
      runId: 'pre-fix',
      hypothesisId: 'A',
      location: 'seedHomeContent.js:seedHomeContent',
      message: 'prisma home content delegate check',
      data: {
        hasHomeBanner: Boolean(prisma.homeBanner?.count),
        hasBrandIntro: Boolean(prisma.brandIntro?.upsert),
        hasBrandIntroSection: Boolean(prisma.brandIntroSection?.count),
        delegateKeys: Object.keys(prisma).filter((k) => !k.startsWith('$') && !k.startsWith('_')),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  assertHomeContentClient(prisma);

  const bannerCount = await prisma.homeBanner.count();
  if (bannerCount === 0) {
    const bannerSources = [
      '../mini/src/static/banner/ban1.jpg',
      '../mini/src/static/banner/ban2.jpg',
      '../mini/src/static/banner/ban3.jpg',
    ];
    for (let i = 0; i < bannerSources.length; i++) {
      const imageUrl = await resolveStaticImage(bannerSources[i]);
      if (!imageUrl) continue;
      await prisma.homeBanner.create({
        data: {
          imageUrl,
          linkUrl: null,
          sort: i,
          enabled: true,
        },
      });
    }
    console.log('  + home banners seeded');
  }

  const brandCover = await resolveStaticImage('../mini/src/static/brand/a1.jpg');

  await prisma.brandIntro.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      homeCoverImage: brandCover,
      homeSummary: DEFAULT_HOME_SUMMARY,
      introHeroImage: brandCover,
      brandName: '才汇纺织',
      brandSubtitle: '广州才汇纺织科技有限公司',
      showIntroButton: true,
    },
  });

  const sectionCount = await prisma.brandIntroSection.count();
  if (sectionCount === 0) {
    await prisma.brandIntroSection.createMany({
      data: DEFAULT_SECTIONS,
    });
    console.log('  + brand intro sections seeded');
  }
}

module.exports = { seedHomeContent };
