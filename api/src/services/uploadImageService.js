const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function resolveSafeExt(originalname) {
  const ext = path.extname(originalname || '').toLowerCase() || '.jpg';
  return IMAGE_EXTS.includes(ext) ? ext : '.jpg';
}

async function saveUploadedImage(buffer, originalname) {
  const safeExt = resolveSafeExt(originalname);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const filename = `${hash}${safeExt}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  const url = `/uploads/${filename}`;

  if (fs.existsSync(filePath)) {
    return { url, deduplicated: true };
  }

  try {
    await fs.promises.writeFile(filePath, buffer, { flag: 'wx' });
    return { url, deduplicated: false };
  } catch (err) {
    if (err.code === 'EEXIST') {
      return { url, deduplicated: true };
    }
    throw err;
  }
}

async function saveUploadedImageFromFile(absPath, originalname = '.jpg') {
  const buffer = await fs.promises.readFile(absPath);
  return saveUploadedImage(buffer, originalname);
}

module.exports = {
  UPLOADS_DIR,
  IMAGE_EXTS,
  resolveSafeExt,
  saveUploadedImage,
  saveUploadedImageFromFile,
};
