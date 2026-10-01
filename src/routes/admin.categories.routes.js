const express = require('express');
const categoriesController = require('../controllers/categories.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', categoriesController.list);
router.post('/', categoriesController.create);
router.patch('/:id', categoriesController.update);
router.patch('/:id/deactivate', categoriesController.deactivate);

module.exports = router;
