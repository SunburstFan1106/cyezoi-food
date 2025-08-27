const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const auth = require('../controllers/authController');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/me', verifyToken, auth.me);

module.exports = router;
