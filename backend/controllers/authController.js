const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const user = await authService.registerUser(email, password, firstName, lastName);
      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user,
      });
    } catch (error) {
      logger.error('Register controller error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Verification token required' });
      }

      const user = await authService.verifyEmail(token);
      res.json({ message: 'Email verified successfully', user });
    } catch (error) {
      logger.error('Verify email controller error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const result = await authService.loginUser(email, password);
      res.json(result);
    } catch (error) {
      logger.error('Login controller error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const result = await authService.requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      logger.error('Request password reset controller error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const result = await authService.resetPassword(token, password);
      res.json(result);
    } catch (error) {
      logger.error('Reset password controller error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const result = await authService.refreshAccessToken(refreshToken);
      res.json(result);
    } catch (error) {
      logger.error('Refresh token controller error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await authService.getUserProfile(userId);
      res.json(user);
    } catch (error) {
      logger.error('Get profile controller error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const user = await authService.updateUserProfile(userId, updates);
      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      logger.error('Update profile controller error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
