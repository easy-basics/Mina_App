const express = require('express');

const authRoutes = require('./auth');
const catalogRoutes = require('./catalog');
const favoriteRoutes = require('./favorites');
const cartRoutes = require('./cart');
const addressRoutes = require('./addresses');
const orderRoutes = require('./orders');
const payRoutes = require('./pay');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/cart', cartRoutes);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);
router.use('/pay', payRoutes);

module.exports = router;
