const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const menu = require('../controllers/menuController');

// 公共路由
router.get('/today', menu.getTodayMenu);
router.get('/week', menu.getWeekMenu);
router.get('/day/:date', menu.getDayMenu); // 新增：获取指定日期的所有餐次

// 管理员路由
router.get('/:menuId', verifyToken, requireAdmin, menu.getMenuById);
router.post('/', verifyToken, requireAdmin, menu.createMenu);
router.put('/:menuId', verifyToken, requireAdmin, menu.updateMenu);
router.delete('/:menuId', verifyToken, requireAdmin, menu.deleteMenu);
router.post('/crawl', verifyToken, requireAdmin, menu.crawlMenu);
router.post('/admin/create', verifyToken, requireAdmin, menu.createMenu);

module.exports = router;