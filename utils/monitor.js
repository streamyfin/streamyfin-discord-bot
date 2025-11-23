/**
 * Production monitoring utilities
 */

import redisClient from '../redisClient.js';
import Logger from './logger.js';

const logger = new Logger('MONITOR');

class ProductionMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      commandsExecuted: 0,
      errorsCount: 0,
      memoryUsage: process.memoryUsage(),
      lastHealthCheck: Date.now()
    };
    
    // Update metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 30000);
  }

  /**
   * Update system metrics
   */
  updateMetrics() {
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.lastHealthCheck = Date.now();
    
    // Store in Redis for persistence
    this.storeMetrics().catch(error => {
      logger.error('Failed to store metrics:', error);
    });
  }

  // Store in Redis for persistence
  async storeMetrics() {
    try {
      await redisClient.hset('bot:metrics', {
        startTime: this.metrics.startTime.toString(),
        commandsExecuted: this.metrics.commandsExecuted.toString(),
        errorsCount: this.metrics.errorsCount.toString(),
        memoryUsageMB: Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024).toString(),
        lastHealthCheck: this.metrics.lastHealthCheck.toString(),
        uptime: (Date.now() - this.metrics.startTime).toString()
      });
    } catch (error) {
      logger.warn('Redis metrics storage failed:', error.message);
    }
  }

  /**
   * Increment command counter
   * @param {string} commandName - Name of the executed command
   */
  recordCommand(commandName) {
    this.metrics.commandsExecuted++;
    logger.debug(`Command executed: ${commandName} (Total: ${this.metrics.commandsExecuted})`);
  }

  /**
   * Increment error counter
   * @param {string} errorType - Type of error
   */
  recordError(errorType = 'unknown') {
    this.metrics.errorsCount++;
    logger.warn(`Error recorded: ${errorType} (Total: ${this.metrics.errorsCount})`);
  }

  /**
   * Check system health
   * @returns {Object} Health status
   */
  async checkHealth() {
    const memUsageMB = Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024);
    const uptime = Date.now() - this.metrics.startTime;
    
    const health = {
      status: 'healthy',
      uptime,
      memoryUsageMB: memUsageMB,
      commandsExecuted: this.metrics.commandsExecuted,
      errorsCount: this.metrics.errorsCount,
      errorRate: this.metrics.commandsExecuted > 0 
        ? (this.metrics.errorsCount / this.metrics.commandsExecuted * 100).toFixed(2) 
        : '0.00',
      timestamp: Date.now()
    };

    // Check for critical conditions
    if (memUsageMB > 512) { // 512MB threshold
      health.status = 'warning';
      health.warnings = health.warnings || [];
      health.warnings.push('High memory usage detected');
    }

    if (parseFloat(health.errorRate) > 5) { // 5% error rate threshold
      health.status = 'warning';
      health.warnings = health.warnings || [];
      health.warnings.push('High error rate detected');
    }

    // Test Redis connectivity
    try {
      await redisClient.ping();
    } catch (error) {
      health.status = 'critical';
      health.errors = health.errors || [];
      health.errors.push('Redis connection failed');
    }

    return health;
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance data
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
      memoryUsageMB: Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024)
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

// Export singleton instance
export default new ProductionMonitor();