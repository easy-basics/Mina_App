const path = require('path');
const fs = require('fs');
const prisma = require('../utils/prisma');
const { toRelativeMediaPath, toAbsoluteUrl } = require('../utils/url');
const { UPLOADS_DIR, IMAGE_EXTS } = require('./uploadImageService');

async function collectReferencedPaths() {
  const referenced = new Set();

  const [products, detailImages, shopProfiles, users, homeBanners, brandIntros, categories] = await Promise.all([
    prisma.product.findMany({ select: { coverImage: true } }),
    prisma.productDetailImage.findMany({ select: { url: true } }),
    prisma.shopProfile.findMany({ select: { coverImage: true } }),
    prisma.user.findMany({ select: { avatar: true } }),
    prisma.homeBanner.findMany({ select: { imageUrl: true } }),
    prisma.brandIntro.findMany({
      select: { homeCoverImage: true, introHeroImage: true },
    }),
    prisma.category.findMany({ select: { coverImage: true } }),
  ]);

  for (const row of products) {
    const p = toRelativeMediaPath(row.coverImage);
    if (p) referenced.add(p);
  }
  for (const row of detailImages) {
    const p = toRelativeMediaPath(row.url);
    if (p) referenced.add(p);
  }
  for (const row of shopProfiles) {
    const p = toRelativeMediaPath(row.coverImage);
    if (p) referenced.add(p);
  }
  for (const row of users) {
    const p = toRelativeMediaPath(row.avatar);
    if (p) referenced.add(p);
  }
  for (const row of homeBanners) {
    const p = toRelativeMediaPath(row.imageUrl);
    if (p) referenced.add(p);
  }
  for (const row of brandIntros) {
    for (const field of [row.homeCoverImage, row.introHeroImage]) {
      const p = toRelativeMediaPath(field);
      if (p) referenced.add(p);
    }
  }
  for (const row of categories) {
    const p = toRelativeMediaPath(row.coverImage);
    if (p) referenced.add(p);
  }

  return referenced;
}

async function walkUploadFiles(dir, baseDir = dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkUploadFiles(fullPath, baseDir));
      continue;
    }
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTS.includes(ext)) continue;

    const relative = path.relative(baseDir, fullPath).split(path.sep).join('/');
    const urlPath = `/uploads/${relative}`;
    const stat = await fs.promises.stat(fullPath);
    files.push({
      path: urlPath,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      previewUrl: toAbsoluteUrl(urlPath),
    });
  }

  return files;
}

async function scanOrphans() {
  const referenced = await collectReferencedPaths();
  const allFiles = await walkUploadFiles(UPLOADS_DIR);
  const orphans = allFiles.filter((file) => !referenced.has(file.path));
  const totalSize = orphans.reduce((sum, file) => sum + file.size, 0);

  return {
    items: orphans,
    count: orphans.length,
    totalSize,
  };
}

function resolveSafeDiskPath(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return null;
  const trimmed = urlPath.trim();
  if (!trimmed.startsWith('/uploads/')) return null;
  if (trimmed.includes('..')) return null;

  const relative = trimmed.slice('/uploads/'.length);
  if (!relative) return null;

  const diskPath = path.resolve(UPLOADS_DIR, relative);
  const uploadsRoot = path.resolve(UPLOADS_DIR);
  if (!diskPath.startsWith(`${uploadsRoot}${path.sep}`) && diskPath !== uploadsRoot) {
    return null;
  }

  const ext = path.extname(diskPath).toLowerCase();
  if (!IMAGE_EXTS.includes(ext)) return null;

  return { urlPath: trimmed, diskPath };
}

async function deleteOrphans(paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    const err = new Error('请选择要删除的文件');
    err.status = 400;
    throw err;
  }

  const referenced = await collectReferencedPaths();
  const deleted = [];
  const skipped = [];

  for (const rawPath of paths) {
    const resolved = resolveSafeDiskPath(rawPath);
    if (!resolved) {
      skipped.push({ path: rawPath, reason: '路径无效' });
      continue;
    }

    if (referenced.has(resolved.urlPath)) {
      skipped.push({ path: resolved.urlPath, reason: '文件仍被引用' });
      continue;
    }

    if (!fs.existsSync(resolved.diskPath)) {
      skipped.push({ path: resolved.urlPath, reason: '文件不存在' });
      continue;
    }

    try {
      await fs.promises.unlink(resolved.diskPath);
      deleted.push(resolved.urlPath);
    } catch (err) {
      skipped.push({ path: resolved.urlPath, reason: err.message || '删除失败' });
    }
  }

  return { deleted, skipped };
}

module.exports = {
  scanOrphans,
  deleteOrphans,
  collectReferencedPaths,
  resolveSafeDiskPath,
};
