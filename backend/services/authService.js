const pool = require('../config/database');
const { hashPassword, comparePassword, generateRandomToken } = require('../utils/crypto');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const logger = require('../utils/logger');

class AuthService {
  async registerUser(email, password, firstName, lastName) {
    try {
      // Check if user exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        throw new Error('Email already registered');
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      const verificationToken = generateRandomToken();

      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, email_verification_token)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role, created_at`,
        [email, passwordHash, firstName, lastName, verificationToken]
      );

      const user = result.rows[0];

      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(email, verificationLink);

      logger.info(`User registered: ${email}`);
      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      const result = await pool.query(
        `UPDATE users 
         SET email_verified = true, email_verification_token = NULL
         WHERE email_verification_token = $1 AND email_verification_token IS NOT NULL
         RETURNING id, email`,
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid or expired verification token');
      }

      logger.info(`Email verified: ${result.rows[0].email}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  async loginUser(email, password) {
    try {
      // Find user
      const result = await pool.query(
        `SELECT id, email, password_hash, role, email_verified, is_active 
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is disabled');
      }

      // Check if email is verified
      if (!user.email_verified) {
        throw new Error('Please verify your email first');
      }

      // Compare passwords
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info(`User logged in: ${email}`);
      return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async requestPasswordReset(email) {
    try {
      const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const resetToken = generateRandomToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await pool.query(
        `UPDATE users 
         SET password_reset_token = $1, password_reset_expires = $2
         WHERE email = $3`,
        [resetToken, expiresAt, email]
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(email, resetLink);

      logger.info(`Password reset requested: ${email}`);
      return { message: 'Password reset link sent to email' };
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const result = await pool.query(
        `SELECT id, password_reset_expires FROM users 
         WHERE password_reset_token = $1 AND password_reset_expires > NOW()`,
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid or expired reset token');
      }

      const userId = result.rows[0].id;
      const passwordHash = await hashPassword(newPassword);

      await pool.query(
        `UPDATE users 
         SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
         WHERE id = $2`,
        [passwordHash, userId]
      );

      logger.info(`Password reset successful for user: ${userId}`);
      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const { verifyToken } = require('../utils/jwt');
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

      const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      const accessToken = generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const result = await pool.query(
        `SELECT id, email, first_name, last_name, phone, role, avatar_url, created_at 
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const allowedFields = ['first_name', 'last_name', 'phone', 'avatar_url'];
      const updates_obj = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updates_obj[field] = updates[field];
        }
      }

      const setClause = Object.keys(updates_obj)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      const values = [...Object.values(updates_obj), userId];

      const result = await pool.query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING id, email, first_name, last_name, phone, avatar_url`,
        values
      );

      logger.info(`User profile updated: ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
