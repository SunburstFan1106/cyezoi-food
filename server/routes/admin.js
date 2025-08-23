const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const admin = require('../controllers/adminController');

// Mount this router at /api/admin, so the full path is /api/admin/users
router.get('/users', verifyToken, requireAdmin, admin.listUsers);

module.exports = router;
