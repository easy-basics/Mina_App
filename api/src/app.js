const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { getCorsOptions } = require('./utils/cors');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const uploadRoutes = require('./routes/upload');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const miniRoutes = require('./routes/mini');

const app = express();

app.set('trust proxy', 1);

app.use(cors(getCorsOptions()));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use('/api/mini/pay/notify', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/mini', miniRoutes);

app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/users', authMiddleware, userRoutes);

app.get('/api/health', (req, res) => {
  const {
    isRealPayEnabled,
    getRealPayDisableReasons,
  } = require('./services/wechatPayService');
  res.json({
    code: 0,
    data: {
      status: 'ok',
      nodeEnv: process.env.NODE_ENV || null,
      payEnabled: isRealPayEnabled(),
      payDisableReasons: getRealPayDisableReasons(),
    },
    message: 'ok',
  });
});

app.use(errorHandler);

module.exports = app;
