/**
 * 商品目录种子数据：5 系列 × 4 商品 × 5–6 颜色 SKU
 * imageSlot 由 prepareSeedImages 映射为 hash 文件 URL（/uploads/{sha256}.jpg）
 */

const BASE_SKUS_5 = [
  { specName: '1#米黄', price: 25 },
  { specName: '2#粉绿', price: 25 },
  { specName: '3#浅粉红', price: 26 },
  { specName: '4#藏青', price: 27 },
  { specName: '5#象牙白', price: 25 },
];

const BASE_SKUS_6 = [
  ...BASE_SKUS_5,
  { specName: '6#灰蓝', price: 28 },
];

const CATEGORIES = [
  {
    name: '雪花棉系列',
    sort: 0,
    products: [
      {
        code: '2448',
        name: '雪花细罗纹',
        sort: 0,
        imageSlot: 0,
        params: {
          幅宽: '150cm',
          克重: '310g',
          成分: '91.2%人棉8.8%氨纶',
          量化: '2.3m',
        },
        skus: BASE_SKUS_6,
      },
      {
        code: '2450',
        name: '雪花双面绒',
        sort: 1,
        imageSlot: 1,
        params: {
          幅宽: '160cm',
          克重: '280g',
          成分: '95%棉5%氨纶',
          量化: '2.1m',
        },
        skus: BASE_SKUS_5,
      },
      {
        code: '2452',
        name: '雪花空气层',
        sort: 2,
        imageSlot: 2,
        params: {
          幅宽: '155cm',
          克重: '320g',
          成分: '88%棉12%涤纶',
          量化: '2.4m',
        },
        skus: BASE_SKUS_6,
      },
      {
        code: '2455',
        name: '雪花珠地网眼',
        sort: 3,
        imageSlot: 3,
        params: {
          幅宽: '150cm',
          克重: '260g',
          成分: '100%精梳棉',
          量化: '2.0m',
        },
        skus: BASE_SKUS_5,
      },
    ],
  },
  {
    name: '罗纹系列',
    sort: 1,
    products: [
      {
        code: '3201',
        name: '32支棉氨罗纹',
        sort: 0,
        imageSlot: 4,
        params: {
          幅宽: '140cm',
          克重: '220g',
          成分: '95%棉5%氨纶',
          量化: '1.9m',
        },
        skus: [
          { specName: '1#米黄', price: 22 },
          { specName: '2#粉绿', price: 22 },
          { specName: '3#浅粉红', price: 23 },
          { specName: '4#藏青', price: 24 },
          { specName: '5#象牙白', price: 22 },
          { specName: '6#灰蓝', price: 25 },
        ],
      },
      {
        code: '3202',
        name: '40支精梳罗纹',
        sort: 1,
        imageSlot: 5,
        params: {
          幅宽: '145cm',
          克重: '240g',
          成分: '97%棉3%氨纶',
          量化: '2.0m',
        },
        skus: BASE_SKUS_5,
      },
      {
        code: '3203',
        name: '2×2宽罗纹',
        sort: 2,
        imageSlot: 6,
        params: {
          幅宽: '150cm',
          克重: '300g',
          成分: '92%棉8%氨纶',
          量化: '2.2m',
        },
        skus: BASE_SKUS_6,
      },
      {
        code: '3204',
        name: '1×1细罗纹',
        sort: 3,
        imageSlot: 7,
        params: {
          幅宽: '140cm',
          克重: '200g',
          成分: '95%棉5%氨纶',
          量化: '1.8m',
        },
        skus: BASE_SKUS_5,
      },
    ],
  },
  {
    name: '阳离子系列',
    sort: 2,
    products: [
      {
        code: '5101',
        name: '阳离子抓绒',
        sort: 0,
        imageSlot: 8,
        params: {
          幅宽: '160cm',
          克重: '280g',
          成分: '100%阳离子涤纶',
          量化: '2.1m',
        },
        skus: BASE_SKUS_6,
      },
      {
        code: '5102',
        name: '阳离子卫衣料',
        sort: 1,
        imageSlot: 9,
        params: {
          幅宽: '165cm',
          克重: '310g',
          成分: '95%阳离子涤纶5%氨纶',
          量化: '2.3m',
        },
        skus: BASE_SKUS_5,
      },
      {
        code: '5103',
        name: '阳离子双面布',
        sort: 2,
        imageSlot: 10,
        params: {
          幅宽: '155cm',
          克重: '260g',
          成分: '100%阳离子涤纶',
          量化: '2.0m',
        },
        skus: BASE_SKUS_5,
      },
      {
        code: '5104',
        name: '阳离子珠地',
        sort: 3,
        imageSlot: 11,
        params: {
          幅宽: '150cm',
          克重: '240g',
          成分: '90%阳离子涤纶10%棉',
          量化: '1.9m',
        },
        skus: BASE_SKUS_6,
      },
    ],
  },
  {
    name: '冰丝莫代尔系列',
    sort: 3,
    products: [
      {
        code: '6101',
        name: '冰丝汗布',
        sort: 0,
        imageSlot: 12,
        params: {
          幅宽: '150cm',
          克重: '180g',
          成分: '65%粘胶35%涤纶',
          量化: '1.8m',
        },
        skus: [
          { specName: '1#米黄', price: 18 },
          { specName: '2#粉绿', price: 18 },
          { specName: '3#浅粉红', price: 19 },
          { specName: '4#藏青', price: 20 },
          { specName: '5#象牙白', price: 18 },
        ],
      },
      {
        code: '6102',
        name: '莫代尔单面',
        sort: 1,
        imageSlot: 13,
        params: {
          幅宽: '160cm',
          克重: '200g',
          成分: '95%莫代尔5%氨纶',
          量化: '2.0m',
        },
        skus: BASE_SKUS_6,
      },
      {
        code: '6103',
        name: '冰丝罗马布',
        sort: 2,
        imageSlot: 14,
        params: {
          幅宽: '155cm',
          克重: '220g',
          成分: '70%粘胶30%涤纶',
          量化: '2.1m',
        },
        skus: BASE_SKUS_5,
      },
      {
        code: '6104',
        name: '莫代尔空气层',
        sort: 3,
        imageSlot: 15,
        params: {
          幅宽: '165cm',
          克重: '260g',
          成分: '88%莫代尔12%氨纶',
          量化: '2.2m',
        },
        skus: BASE_SKUS_6,
      },
    ],
  },
  {
    name: '麻棉天然系列',
    sort: 4,
    products: [
      {
        code: '7101',
        name: '亚麻棉混纺',
        sort: 0,
        imageSlot: 16,
        params: {
          幅宽: '145cm',
          克重: '210g',
          成分: '55%亚麻45%棉',
          量化: '2.0m',
        },
        skus: BASE_SKUS_5,
      },
      {
        code: '7102',
        name: '汉麻平纹',
        sort: 1,
        imageSlot: 17,
        params: {
          幅宽: '150cm',
          克重: '230g',
          成分: '100%汉麻',
          量化: '2.1m',
        },
        skus: BASE_SKUS_6,
      },
      {
        code: '7103',
        name: '棉麻竹节纱',
        sort: 2,
        imageSlot: 18,
        params: {
          幅宽: '155cm',
          克重: '200g',
          成分: '60%棉40%麻',
          量化: '1.9m',
        },
        skus: BASE_SKUS_5,
      },
      {
        code: '7104',
        name: '有机棉麻斜纹',
        sort: 3,
        imageSlot: 19,
        params: {
          幅宽: '160cm',
          克重: '250g',
          成分: '70%有机棉30%亚麻',
          量化: '2.2m',
        },
        skus: BASE_SKUS_6,
      },
    ],
  },
];

/** 本地 static 图源（相对 api/ 目录） */
const LOCAL_IMAGE_SOURCES = [
  '../mini/src/static/showcase/sch-001.jpg',
  '../mini/src/static/showcase/sch-002.jpg',
  '../mini/src/static/showcase/sch-003.jpg',
  '../mini/src/static/showcase/sch-004.jpg',
  '../mini/src/static/showcase/sch-005.jpg',
  '../mini/src/static/showcase/sch-006.jpg',
  '../mini/src/static/banner/ban1.jpg',
  '../mini/src/static/banner/ban2.jpg',
  '../mini/src/static/banner/ban3.jpg',
];

/** Unsplash 布料纹理图（不足时下载补齐，失败时回退到本地图） */
const REMOTE_IMAGE_SOURCES = [
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
  'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
  'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80',
  'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&q=80',
  'https://images.unsplash.com/photo-1610701596007-7650209ae0fe?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
];

function getAllProducts() {
  return CATEGORIES.flatMap((cat) =>
    cat.products.map((p) => ({ ...p, categoryName: cat.name }))
  );
}

module.exports = {
  CATEGORIES,
  LOCAL_IMAGE_SOURCES,
  REMOTE_IMAGE_SOURCES,
  getAllProducts,
};
