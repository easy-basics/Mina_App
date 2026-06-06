const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  LOCAL_IMAGE_SOURCES,
  REMOTE_IMAGE_SOURCES,
  getAllProducts,
} = require('../data/catalogSeedData');

const API_ROOT = path.join(__dirname, '../..');
const SEED_DIR = path.join(API_ROOT, 'uploads', 'seed');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function resolveSourcePath(relPath) {
  return path.resolve(API_ROOT, relPath);
}

function copyIfMissing(src, dest) {
  if (fs.existsSync(dest)) return false;
  if (!fs.existsSync(src)) {
    console.warn(`  skip copy, source missing: ${src}`);
    return false;
  }
  fs.copyFileSync(src, dest);
  return true;
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

async function downloadIfMissing(url, dest) {
  if (fs.existsSync(dest)) return false;
  await downloadFile(url, dest);
  return true;
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
  if (fs.existsSync(tempDest)) return false;

  if (poolEntry.type === 'local') {
    fs.copyFileSync(poolEntry.path, tempDest);
    return true;
  }

  await downloadIfMissing(poolEntry.url, tempDest);
  return true;
}

async function materializeWithFallback(pool, startIndex, dest) {
  const attempts = pool.length;
  for (let i = 0; i < attempts; i++) {
    const entry = pool[(startIndex + i) % pool.length];
    const tempDest = `${dest}.tmp`;
    try {
      await materializeSource(entry, tempDest);
      if (fs.existsSync(tempDest)) {
        fs.renameSync(tempDest, dest);
        return true;
      }
    } catch (err) {
      if (fs.existsSync(tempDest)) fs.unlinkSync(tempDest);
      console.warn(`  image fallback ${i + 1}/${attempts}: ${err.message}`);
    }
  }
  return false;
}

/**
 * 为每个商品生成 cover + 2 张 detail 图到 api/uploads/seed/
 */
async function prepareSeedImages() {
  ensureDir(SEED_DIR);
  const products = getAllProducts();
  const pool = getSourcePool();

  if (pool.length === 0) {
    throw new Error('No image sources available for seed');
  }

  let created = 0;

  for (const product of products) {
    const slot = product.imageSlot % pool.length;
    const coverDest = path.join(SEED_DIR, `${product.code}-cover.jpg`);
    const detail1Dest = path.join(SEED_DIR, `${product.code}-detail-1.jpg`);
    const detail2Dest = path.join(SEED_DIR, `${product.code}-detail-2.jpg`);

    if (!fs.existsSync(coverDest)) {
      if (await materializeWithFallback(pool, slot, coverDest)) created += 1;
    }
    if (!fs.existsSync(detail1Dest)) {
      if (await materializeWithFallback(pool, slot + 1, detail1Dest)) created += 1;
    }
    if (!fs.existsSync(detail2Dest)) {
      if (await materializeWithFallback(pool, slot + 2, detail2Dest)) created += 1;
    }
  }

  console.log(`Seed images ready in ${SEED_DIR} (${created} new files)`);
}

module.exports = { prepareSeedImages, SEED_DIR };
