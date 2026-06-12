const prisma = require('../utils/prisma');
const { toAbsoluteUrl, toRelativeMediaPath } = require('../utils/url');

const SHOP_PROFILE_ID = 1;

function getEnvDefaults() {
  return {
    name: process.env.SHOP_NAME || '',
    address: process.env.SHOP_ADDRESS || '',
    phone: process.env.SHOP_PHONE || '',
    coverImage: null,
    latitude: null,
    longitude: null,
  };
}

function serializeProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    coverImage: profile.coverImage,
    address: profile.address,
    phone: profile.phone,
    latitude: profile.latitude != null ? Number(profile.latitude) : null,
    longitude: profile.longitude != null ? Number(profile.longitude) : null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function formatShopForMini(profile) {
  const item = serializeProfile(profile);
  return {
    name: item.name,
    address: item.address,
    phone: item.phone,
    coverImage: toAbsoluteUrl(item.coverImage),
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

function parseCoord(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num;
}

async function getShopProfile() {
  let profile = await prisma.shopProfile.findUnique({ where: { id: SHOP_PROFILE_ID } });
  if (!profile) {
    const defaults = getEnvDefaults();
    profile = await prisma.shopProfile.create({
      data: {
        id: SHOP_PROFILE_ID,
        name: defaults.name || '门店',
        address: defaults.address || '',
        phone: defaults.phone || '',
        coverImage: defaults.coverImage,
        latitude: defaults.latitude,
        longitude: defaults.longitude,
      },
    });
  }
  return profile;
}

async function updateShopProfile(data) {
  await getShopProfile();

  const name = data.name?.trim();
  const address = data.address?.trim();
  const phone = data.phone?.trim();
  if (!name || !address || !phone) {
    const err = new Error('门店名称、地址、联系电话不能为空');
    err.status = 400;
    throw err;
  }

  const profile = await prisma.shopProfile.update({
    where: { id: SHOP_PROFILE_ID },
    data: {
      name,
      address,
      phone,
      coverImage: data.coverImage !== undefined
        ? (data.coverImage ? toRelativeMediaPath(String(data.coverImage).trim()) : null)
        : undefined,
      latitude: data.latitude !== undefined ? parseCoord(data.latitude) : undefined,
      longitude: data.longitude !== undefined ? parseCoord(data.longitude) : undefined,
    },
  });

  return serializeProfile(profile);
}

module.exports = {
  getShopProfile,
  serializeProfile,
  formatShopForMini,
  updateShopProfile,
};
