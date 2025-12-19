import bcrypt from 'bcrypt';
import crypto from 'crypto';
import redisClient from '../redisClient.js';
import Logger from './logger.js';

const logger = new Logger('AUTH');

export class AuthManager {
  constructor() {
    this.saltRounds = 12;
    this.sessionExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize admin password hash if not exists
   */
  async initializeAuth() {
    try {
      const hashedPassword = await redisClient.get('admin:password');
      if (!hashedPassword) {
        // Use environment password or generate secure default
        const password = process.env.ADMIN_PASSWORD || this.generateSecurePassword();
        await this.setAdminPassword(password);
        
        if (!process.env.ADMIN_PASSWORD) {
          logger.warn(`Generated admin password: ${password} - CHANGE IMMEDIATELY!`);
          console.log(`\n🔐 ADMIN PASSWORD: ${password}\n`);
        }
      }
    } catch (error) {
      logger.error('Error initializing auth:', error);
    }
  }

  /**
   * Set admin password
   * @param {string} password 
   */
  async setAdminPassword(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    await redisClient.set('admin:password', hashedPassword);
    logger.info('Admin password updated');
  }

  /**
   * Authenticate admin
   * @param {string} password 
   * @returns {Promise<{success: boolean, sessionToken?: string, message: string}>}
   */
  async authenticateAdmin(password) {
    try {
      const hashedPassword = await redisClient.get('admin:password');
      if (!hashedPassword) {
        return { success: false, message: 'Authentication not configured' };
      }

      const isValid = await bcrypt.compare(password, hashedPassword);
      if (!isValid) {
        logger.warn('Failed admin login attempt');
        return { success: false, message: 'Invalid password' };
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionData = {
        createdAt: Date.now(),
        expiresAt: Date.now() + this.sessionExpiry,
        ip: null // Will be set by caller
      };

      await redisClient.setEx(`session:${sessionToken}`, 
        Math.floor(this.sessionExpiry / 1000), 
        JSON.stringify(sessionData)
      );

      logger.info('Admin logged in successfully');
      return { success: true, sessionToken, message: 'Login successful' };
    } catch (error) {
      logger.error('Error authenticating admin:', error);
      return { success: false, message: 'Authentication failed' };
    }
  }

  /**
   * Validate session token
   * @param {string} token 
   * @returns {Promise<boolean>}
   */
  async validateSession(token) {
    try {
      if (!token) return false;
      
      const sessionData = await redisClient.get(`session:${token}`);
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      if (Date.now() > session.expiresAt) {
        await this.invalidateSession(token);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating session:', error);
      return false;
    }
  }

  /**
   * Invalidate session
   * @param {string} token 
   */
  async invalidateSession(token) {
    try {
      await redisClient.del(`session:${token}`);
    } catch (error) {
      logger.error('Error invalidating session:', error);
    }
  }

  /**
   * Generate secure random password
   * @returns {string}
   */
  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Change admin password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const authResult = await this.authenticateAdmin(currentPassword);
      if (!authResult.success) {
        return { success: false, message: 'Current password incorrect' };
      }

      await this.setAdminPassword(newPassword);
      
      // Invalidate all sessions
      await this.invalidateAllSessions();
      
      logger.info('Admin password changed');
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Error changing password:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Invalidate all sessions
   */
  async invalidateAllSessions() {
    try {
      const keys = await redisClient.keys('session:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Error invalidating all sessions:', error);
    }
  }
}

export default new AuthManager();