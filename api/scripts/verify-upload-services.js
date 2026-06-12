/**
 * 验证 hash 去重上传与孤儿扫描逻辑（无需启动 HTTP 服务）
 * 用法: node scripts/verify-upload-services.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { saveUploadedImage, UPLOADS_DIR } = require('../src/services/uploadImageService');
const {
  resolveSafeDiskPath,
  collectReferencedPaths,
} = require('../src/services/uploadOrphanService');

async function testHashDedup() {
  const buffer = Buffer.from(`test-image-${Date.now()}`);
  const first = await saveUploadedImage(buffer, 'sample.png');
  const second = await saveUploadedImage(buffer, 'sample.png');

  if (first.url !== second.url) {
    throw new Error(`dedup failed: ${first.url} !== ${second.url}`);
  }

  const diskPath = path.join(UPLOADS_DIR, path.basename(first.url));
  if (!fs.existsSync(diskPath)) {
    throw new Error(`file missing: ${diskPath}`);
  }

  console.log('OK hash dedup:', first.url);
}

function testPathSecurity() {
  const valid = resolveSafeDiskPath('/uploads/abc.jpg');
  if (!valid?.diskPath) throw new Error('valid path rejected');

  const traversal = resolveSafeDiskPath('/uploads/../etc/passwd');
  if (traversal) throw new Error('path traversal not blocked');

  const outside = resolveSafeDiskPath('/static/logo.svg');
  if (outside) throw new Error('non-uploads path accepted');

  console.log('OK path security');
}

async function testReferencedPaths() {
  try {
    const refs = await collectReferencedPaths();
    if (!(refs instanceof Set)) throw new Error('expected Set');
    console.log('OK referenced paths:', refs.size, 'entries');
  } catch (err) {
    if (err.name === 'PrismaClientInitializationError') {
      console.log('SKIP referenced paths (database unavailable)');
      return;
    }
    throw err;
  }
}

async function main() {
  await testHashDedup();
  testPathSecurity();
  await testReferencedPaths();
  console.log('All checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
