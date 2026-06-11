function getShopInfo() {
  return {
    name: process.env.SHOP_NAME || '',
    address: process.env.SHOP_ADDRESS || '',
    phone: process.env.SHOP_PHONE || '',
  };
}

function parsePickupSnapshot(pickupSnapshot) {
  if (!pickupSnapshot) return null;
  try {
    return JSON.parse(pickupSnapshot);
  } catch {
    return null;
  }
}

function buildPickupSnapshot() {
  return JSON.stringify(getShopInfo());
}

module.exports = {
  getShopInfo,
  parsePickupSnapshot,
  buildPickupSnapshot,
};
