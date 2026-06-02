const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const { success, fail } = require('../utils/response');
const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const mime = file.mimetype || ''
    const ext = path.extname(file.originalname || '').toLowerCase()
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const okMime =
      ALLOWED_MIME.has(mime) ||
      mime === 'application/octet-stream' ||
      imageExts.includes(ext)
    if (!okMime) {
      return cb(new Error('仅支持 jpg、png、webp、gif 图片'));
    }
    cb(null, true);
  },
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return fail(res, '请选择要上传的文件');
  }
  const url = `/uploads/${req.file.filename}`;
  return success(res, { url });
});

module.exports = router;
