const express = require('express');
const skusController = require('../controllers/skus.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.patch('/:id', skusController.update);

module.exports = router;
