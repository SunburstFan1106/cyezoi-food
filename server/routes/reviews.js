const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const reviews = require('../controllers/reviewController');

// 食品下评论
router.get('/foods/:foodId/reviews', reviews.listByFood);
router.post('/foods/:foodId/reviews', verifyToken, reviews.create);

// 独立评论操作
router.put('/reviews/:reviewId', verifyToken, reviews.update);
router.delete('/reviews/:reviewId', verifyToken, reviews.remove);
router.post('/reviews/:reviewId/like', verifyToken, reviews.toggleLike);

module.exports = router;
