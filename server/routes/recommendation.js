const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const rec = require('../controllers/recommendationController');

router.get('/daily-recommendation', verifyToken, rec.today);
router.get('/daily-recommendation/history', verifyToken, rec.history);

module.exports = router;
