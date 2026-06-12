/**
 * 验证 seed hash 命名（无需数据库）
 * 用法: node scripts/verify-seed-hash.js
 */
const fs = require('fs');
const path = require('path');
const { prepareSeedImages } = require('../prisma/lib/prepareSeedImages');
const { UPLOADS_DIR } = require('../src/services/uploadImageService');

const HASH_URL_RE = /^\/uploads\/[a-f0-9]{64}\.jpg$/;

async function main() {
  const manifest = await prepareSeedImages();
  const codes = Object.keys(manifest);

  if (codes.length === 0) {
    throw new Error('manifest is empty');
  }

  const allUrls = [];
  for (const code of codes) {
    const entry = manifest[code];
    if (!HASH_URL_RE.test(entry.cover)) {
      throw new Error(`invalid cover URL for ${code}: ${entry.cover}`);
    }
    for (const url of entry.details) {
      if (!HASH_URL_RE.test(url)) {
        throw new Error(`invalid detail URL for ${code}: ${url}`);
      }
      allUrls.push(url);
    }
    allUrls.push(entry.cover);
  }

  const uniqueUrls = new Set(allUrls);
  for (const url of uniqueUrls) {
    const filename = path.basename(url);
    const diskPath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(diskPath)) {
      throw new Error(`file missing on disk: ${diskPath}`);
    }
  }

  console.log(`OK manifest: ${codes.length} products`);
  console.log(`OK URLs: ${allUrls.length} slots, ${uniqueUrls.size} unique files on disk`);
  console.log('Sample:', manifest[codes[0]]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
