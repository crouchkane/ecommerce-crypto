const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, authController.register.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/verify-email', authLimiter, authController.verifyEmail.bind(authController));
router.post('/request-password-reset', authLimiter, authController.requestPasswordReset.bind(authController));
router.post('/reset-password', authLimiter, authController.resetPassword.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));
router.put('/profile', authMiddleware, authController.updateProfile.bind(authController));

module.exports = router;
