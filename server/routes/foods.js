const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController'); // 控制器内部已修正模型路径
const { requireAuth } = require('../middleware/auth'); // 假设存在

router.get('/', foodController.listFoods);
router.post('/', requireAuth, foodController.createFood);
router.put('/:id', requireAuth, foodController.updateFood);
router.delete('/:id', requireAuth, foodController.deleteFood);

module.exports = router;