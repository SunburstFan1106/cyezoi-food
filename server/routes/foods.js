const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
// 使用根目录的鉴权中间件
const { verifyToken, optionalAuth } = require('../../middleware/auth');

// 列表公开，附带可选认证以便识别当前用户
router.get('/', optionalAuth, foodController.listFoods);
// 创建/更新/删除需要登录（作者或管理员权限在控制器内校验）
router.post('/', verifyToken, foodController.createFood);
router.put('/:id', verifyToken, foodController.updateFood);
router.delete('/:id', verifyToken, foodController.deleteFood);

module.exports = router;