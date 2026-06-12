const { initDefaultParams } = require('../../src/services/productExtrasService');
const { CATEGORIES } = require('../data/catalogSeedData');
const { prepareSeedImages } = require('./prepareSeedImages');

function isLegacySeedPath(url) {
  return Boolean(url && url.startsWith('/uploads/seed/'));
}

async function ensureCategory(prisma, { name, sort }) {
  let category = await prisma.category.findFirst({ where: { name, parentId: null } });
  if (!category) {
    category = await prisma.category.create({
      data: { name, sort, enabled: true, parentId: null },
    });
    console.log(`  + category: ${name}`);
  } else if (category.sort !== sort) {
    await prisma.category.update({ where: { id: category.id }, data: { sort } });
  }
  return category;
}

async function ensureProduct(prisma, categoryId, product, imageEntry) {
  if (!imageEntry?.cover) {
    throw new Error(`No cover image in manifest for product ${product.code}`);
  }

  const cover = imageEntry.cover;
  const existing = await prisma.product.findMany({ where: { code: product.code } });

  if (existing.length === 0) {
    const row = await prisma.product.create({
      data: {
        categoryId,
        code: product.code,
        name: product.name,
        coverImage: cover,
        enabled: true,
        sort: product.sort,
      },
    });
    console.log(`  + product: ${product.code} ${product.name}`);
    return row;
  }

  let primary = existing[0];
  for (const row of existing) {
    const updates = {};
    if (!row.coverImage || isLegacySeedPath(row.coverImage)) {
      updates.coverImage = cover;
    }
    if (row.categoryId !== categoryId) updates.categoryId = categoryId;
    if (Object.keys(updates).length) {
      await prisma.product.update({ where: { id: row.id }, data: updates });
    }
  }

  if (primary.categoryId !== categoryId) {
    primary = await prisma.product.update({
      where: { id: primary.id },
      data: { categoryId },
    });
  }

  return primary;
}

async function ensureParams(prisma, productId, params) {
  await initDefaultParams(productId);

  for (const [name, value] of Object.entries(params)) {
    const param = await prisma.productParam.findFirst({
      where: { productId, name },
    });
    if (param && !param.value) {
      await prisma.productParam.update({
        where: { id: param.id },
        data: { value },
      });
    }
  }
}

async function ensureDetailImages(prisma, productId, details) {
  if (!details?.length) return;

  const existing = await prisma.productDetailImage.findMany({
    where: { productId },
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
  });

  if (existing.length === 0) {
    await prisma.productDetailImage.createMany({
      data: details.map((url, sort) => ({ productId, url, sort })),
    });
    return;
  }

  const hasLegacy = existing.some((img) => isLegacySeedPath(img.url));
  if (!hasLegacy) return;

  await prisma.productDetailImage.deleteMany({ where: { productId } });
  await prisma.productDetailImage.createMany({
    data: details.map((url, sort) => ({ productId, url, sort })),
  });
}

async function ensureDetailImagesForCode(prisma, code, imageEntry) {
  if (!imageEntry?.details?.length) return;

  const products = await prisma.product.findMany({ where: { code } });
  for (const row of products) {
    await ensureDetailImages(prisma, row.id, imageEntry.details);
  }
}

async function ensureSkus(prisma, productId, skus) {
  for (let i = 0; i < skus.length; i++) {
    const spec = skus[i];
    const existing = await prisma.productSku.findFirst({
      where: { productId, specName: spec.specName },
    });
    if (!existing) {
      await prisma.productSku.create({
        data: {
          productId,
          specName: spec.specName,
          price: spec.price,
          sort: i,
          enabled: true,
        },
      });
    }
  }
}

async function seedCatalog(prisma) {
  console.log('Seeding catalog...');

  const manifest = await prepareSeedImages();

  for (const cat of CATEGORIES) {
    const category = await ensureCategory(prisma, cat);
    for (const product of cat.products) {
      const imageEntry = manifest[product.code];
      const row = await ensureProduct(prisma, category.id, product, imageEntry);
      await ensureParams(prisma, row.id, product.params);
      await ensureDetailImagesForCode(prisma, product.code, imageEntry);
      await ensureSkus(prisma, row.id, product.skus);
    }
  }

  const categoryCount = await prisma.category.count({ where: { parentId: null, enabled: true } });
  const productCount = await prisma.product.count({ where: { enabled: true } });
  const skuCount = await prisma.productSku.count({ where: { enabled: true } });
  console.log(`Catalog seed done: ${categoryCount} categories, ${productCount} products, ${skuCount} SKUs`);
}

module.exports = { seedCatalog };
