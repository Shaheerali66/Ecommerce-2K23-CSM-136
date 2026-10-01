const express = require('express');
const productsController = require('../controllers/products.controller');
const skusController = require('../controllers/skus.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', productsController.list);
router.post('/', productsController.create);
router.patch('/:id', productsController.update);

// Add a validated SKU (and, if needed, its variant) to a product.
router.post('/:id/skus', skusController.createForProduct);

module.exports = router;
