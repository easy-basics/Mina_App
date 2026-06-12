const {
  getShopProfile,
  serializeProfile,
  formatShopForMini,
  updateShopProfile,
} = require('../services/shopSettingsService');

async function getShopInfo() {
  const profile = await getShopProfile();
  return formatShopForMini(profile);
}

function parsePickupSnapshot(pickupSnapshot) {
  if (!pickupSnapshot) return null;
  try {
    return JSON.parse(pickupSnapshot);
  } catch {
    return null;
  }
}

async function buildPickupSnapshot() {
  const profile = await getShopProfile();
  const item = serializeProfile(profile);
  return JSON.stringify({
    name: item.name,
    address: item.address,
    phone: item.phone,
  });
}

module.exports = {
  getShopInfo,
  parsePickupSnapshot,
  buildPickupSnapshot,
};
