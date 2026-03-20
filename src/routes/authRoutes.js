const router = require('express').Router();
const { login, signup, getMe, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authMiddleware, getMe);

module.exports = router;
