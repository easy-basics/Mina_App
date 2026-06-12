const path = require('path');
const express = require('express');
const multer = require('multer');
const { success, fail } = require('../utils/response');
const { saveUploadedImage } = require('../services/uploadImageService');

const router = express.Router();

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE = Number(process.env.UPLOAD_MAX_FILE_SIZE || 5 * 1024 * 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(req, file, cb) {
    const mime = file.mimetype || '';
    const ext = path.extname(file.originalname || '').toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const okMime =
      ALLOWED_MIME.has(mime) ||
      mime === 'application/octet-stream' ||
      imageExts.includes(ext);
    if (!okMime) {
      return cb(new Error('仅支持 jpg、png、webp、gif 图片'));
    }
    cb(null, true);
  },
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return fail(res, '请选择要上传的文件');
    }
    const { url } = await saveUploadedImage(req.file.buffer, req.file.originalname);
    return success(res, { url });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
