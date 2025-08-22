const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const ctrl = require('../controllers/announcementController');

// 挂载到 /api/announcements
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', verifyToken, requireAdmin, ctrl.create);
router.put('/:id', verifyToken, requireAdmin, ctrl.update);
router.delete('/:id', verifyToken, requireAdmin, ctrl.remove);

module.exports = router;
