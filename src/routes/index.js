const express = require('express');

const authRoutes = require('./auth.routes');
const adminCategoriesRoutes = require('./admin.categories.routes');
const adminProductsRoutes = require('./admin.products.routes');
const adminSkusRoutes = require('./admin.skus.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin/categories', adminCategoriesRoutes);
router.use('/admin/products', adminProductsRoutes);
router.use('/admin/skus', adminSkusRoutes);

module.exports = router;
