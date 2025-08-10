const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { requireAuth } = require('../middleware/auth'); // 假设存在

router.get('/', foodController.listFoods);
router.post('/', requireAuth, foodController.createFood);
router.delete('/:id', requireAuth, foodController.deleteFood);

module.exports = router;