const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const {
  LOCAL_IMAGE_SOURCES,
  REMOTE_IMAGE_SOURCES,
  getAllProducts,
} = require('../data/catalogSeedData');
const { saveUploadedImageFromFile } = require('../../src/services/uploadImageService');

const API_ROOT = path.join(__dirname, '../..');

function resolveSourcePath(relPath) {
  return path.resolve(API_ROOT, relPath);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      https
        .get(targetUrl, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            file.close();
            fs.unlinkSync(dest);
            request(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            file.close();
            fs.unlink(dest, () => {});
            reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
            return;
          }
          res.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        })
        .on('error', (err) => {
          file.close();
          fs.unlink(dest, () => {});
          reject(err);
        });
    };
    request(url);
  });
}

function getSourcePool() {
  const pool = [];

  for (const rel of LOCAL_IMAGE_SOURCES) {
    const abs = resolveSourcePath(rel);
    if (fs.existsSync(abs)) {
      pool.push({ type: 'local', path: abs });
    }
  }

  for (const url of REMOTE_IMAGE_SOURCES) {
    pool.push({ type: 'remote', url });
  }

  return pool;
}

async function materializeSource(poolEntry, tempDest) {
  if (poolEntry.type === 'local') {
    fs.copyFileSync(poolEntry.path, tempDest);
    return;
  }

  await downloadFile(poolEntry.url, tempDest);
}

function createTempPath() {
  return path.join(
    os.tmpdir(),
    `mina-seed-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  );
}

async function poolEntryToUrl(pool, startIndex) {
  const attempts = pool.length;
  for (let i = 0; i < attempts; i++) {
    const entry = pool[(startIndex + i) % pool.length];
    const tempDest = createTempPath();
    try {
      await materializeSource(entry, tempDest);
      const { url } = await saveUploadedImageFromFile(tempDest, '.jpg');
      return url;
    } catch (err) {
      console.warn(`  image fallback ${i + 1}/${attempts}: ${err.message}`);
    } finally {
      if (fs.existsSync(tempDest)) fs.unlinkSync(tempDest);
    }
  }
  throw new Error(`Failed to materialize image from pool at index ${startIndex}`);
}

/**
 * 为每个商品生成 cover + 2 张 detail 图到 api/uploads/（hash 命名）
 * @returns {Record<string, { cover: string, details: string[] }>}
 */
async function prepareSeedImages() {
  const products = getAllProducts();
  const pool = getSourcePool();

  if (pool.length === 0) {
    throw new Error('No image sources available for seed');
  }

  const manifest = {};
  let newFiles = 0;

  for (const product of products) {
    const slot = product.imageSlot % pool.length;
    const cover = await poolEntryToUrl(pool, slot);
    const detail1 = await poolEntryToUrl(pool, slot + 1);
    const detail2 = await poolEntryToUrl(pool, slot + 2);

    manifest[product.code] = {
      cover,
      details: [detail1, detail2],
    };
    newFiles += 3;
  }

  console.log(`Seed images ready in uploads/ (${products.length} products, ${newFiles} slots resolved)`);
  return manifest;
}

module.exports = { prepareSeedImages };
