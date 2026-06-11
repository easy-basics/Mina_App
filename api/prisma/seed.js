const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { initDefaultParams } = require('../src/services/productExtrasService');
const { buildPickupSnapshot } = require('../src/utils/shopConfig');
const { seedCatalog } = require('./lib/seedCatalog');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`Admin ready: ${admin.username}`);

  const category = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      parentId: null,
      name: '雪花棉系列',
      sort: 0,
      enabled: true,
    },
  });

  const product = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      categoryId: category.id,
      code: '2448',
      name: '雪花细罗纹',
      enabled: true,
      sort: 0,
    },
  });

  await initDefaultParams(product.id);
  await prisma.productParam.updateMany({
    where: { productId: product.id, name: '幅宽' },
    data: { value: '150cm' },
  });
  await prisma.productParam.updateMany({
    where: { productId: product.id, name: '克重' },
    data: { value: '310g' },
  });
  await prisma.productParam.updateMany({
    where: { productId: product.id, name: '成分' },
    data: { value: '91.2%人棉8.8%氨纶' },
  });
  await prisma.productParam.updateMany({
    where: { productId: product.id, name: '量化' },
    data: { value: '2.3m' },
  });

  const skuSpecs = [
    { specName: '1#米黄', price: 25 },
    { specName: '2#粉绿', price: 25 },
    { specName: '3#浅粉红', price: 25 },
  ];

  for (let i = 0; i < skuSpecs.length; i++) {
    const spec = skuSpecs[i];
    const existing = await prisma.productSku.findFirst({
      where: { productId: product.id, specName: spec.specName },
    });
    if (!existing) {
      await prisma.productSku.create({
        data: {
          productId: product.id,
          specName: spec.specName,
          price: spec.price,
          sort: i,
          enabled: true,
        },
      });
    }
  }

  const skus = await prisma.productSku.findMany({ where: { productId: product.id } });

  const existingSample = await prisma.order.findFirst({
    where: { orderNo: 'M202605160001' },
  });

  if (!existingSample && skus.length >= 2) {
    await prisma.order.create({
      data: {
        orderNo: 'M202605160001',
        orderType: 'sample',
        status: 'paid',
        payStatus: 'paid',
        totalAmount: 50,
        deliveryType: 'pickup',
        pickupSnapshot: buildPickupSnapshot(),
        customerName: '李先生',
        customerPhone: '13900001111',
        remark: '布版订单示例',
        items: {
          create: [
            {
              skuId: skus[0].id,
              specName: skus[0].specName,
              quantity: 1,
              unitPrice: skus[0].price,
            },
            {
              skuId: skus[1].id,
              specName: skus[1].specName,
              quantity: 1,
              unitPrice: skus[1].price,
            },
          ],
        },
        logs: {
          create: { content: '示例布版订单，已支付', adminId: admin.id },
        },
      },
    });
  }

  const existingBulk = await prisma.order.findFirst({
    where: { orderNo: 'M202605160002' },
  });

  if (!existingBulk && skus.length >= 1) {
    await prisma.order.create({
      data: {
        orderNo: 'M202605160002',
        orderType: 'bulk',
        status: 'following',
        payStatus: 'offline',
        totalAmount: 0,
        customerName: '王女士',
        customerPhone: '13900002222',
        remark: '大货意向单示例',
        items: {
          create: [
            {
              skuId: skus[0].id,
              specName: skus[0].specName,
              quantity: 100,
              unitPrice: 25,
            },
          ],
        },
        logs: {
          create: { content: '客户意向大货，待线下沟通', adminId: admin.id },
        },
      },
    });
  }

  await seedCatalog(prisma);

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
