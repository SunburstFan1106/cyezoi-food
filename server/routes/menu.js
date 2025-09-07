const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const menu = require('../controllers/menuController');

// 公共路由
router.get('/today', menu.getTodayMenu);
router.get('/week', menu.getWeekMenu);

// 管理员路由
router.post('/', verifyToken, requireAdmin, menu.createMenu);
router.put('/:menuId', verifyToken, requireAdmin, menu.updateMenu);
router.delete('/:menuId', verifyToken, requireAdmin, menu.deleteMenu);
router.post('/crawl', verifyToken, requireAdmin, menu.crawlMenu);

module.exports = router;