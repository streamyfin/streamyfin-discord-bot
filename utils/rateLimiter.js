/**
 * Production-ready API rate limiting utility
 */

import { SECURITY_CONFIG } from './production.js';

class RateLimiter {
  constructor() {
    this.clients = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, SECURITY_CONFIG.RATE_LIMIT_WINDOW);
  }

  /**
   * Check if request is rate limited
   * @param {string} clientId - Client identifier (user ID, IP, etc.)
   * @param {number} limit - Rate limit (default from config)
   * @param {number} window - Time window in ms (default from config)
   * @returns {Object} Rate limit status
   */
  checkLimit(clientId, limit = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS, window = SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
    const now = Date.now();
    
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        requests: [],
        windowStart: now
      });
    }

    const client = this.clients.get(clientId);
    
    // Clean old requests outside the window
    client.requests = client.requests.filter(timestamp => now - timestamp < window);
    
    // Check if limit exceeded
    if (client.requests.length >= limit) {
      const oldestRequest = Math.min(...client.requests);
      const resetTime = oldestRequest + window;
      
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
        retryAfter: resetTime - now
      };
    }

    // Add current request
    client.requests.push(now);
    
    return {
      allowed: true,
      limit,
      remaining: limit - client.requests.length,
      resetTime: now + window,
      retryAfter: 0
    };
  }

  /**
   * Add a penalty to a client (temporarily increase their usage)
   * @param {string} clientId - Client identifier
   * @param {number} penalty - Number of requests to add as penalty
   */
  addPenalty(clientId, penalty = 5) {
    const now = Date.now();
    
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        requests: [],
        windowStart: now
      });
    }

    const client = this.clients.get(clientId);
    
    // Add penalty requests
    for (let i = 0; i < penalty; i++) {
      client.requests.push(now);
    }
  }

  /**
   * Reset rate limit for a client
   * @param {string} clientId - Client identifier
   */
  reset(clientId) {
    this.clients.delete(clientId);
  }

  /**
   * Get current status for a client
   * @param {string} clientId - Client identifier
   * @returns {Object} Current rate limit status
   */
  getStatus(clientId) {
    if (!this.clients.has(clientId)) {
      return {
        requests: 0,
        remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
        resetTime: Date.now() + SECURITY_CONFIG.RATE_LIMIT_WINDOW
      };
    }

    const client = this.clients.get(clientId);
    const now = Date.now();
    
    // Clean old requests
    client.requests = client.requests.filter(timestamp => now - timestamp < SECURITY_CONFIG.RATE_LIMIT_WINDOW);
    
    return {
      requests: client.requests.length,
      remaining: Math.max(0, SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - client.requests.length),
      resetTime: client.windowStart + SECURITY_CONFIG.RATE_LIMIT_WINDOW
    };
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW * 2; // Keep some buffer

    for (const [clientId, client] of this.clients.entries()) {
      // Remove clients with no recent activity
      if (client.requests.length === 0 || Math.max(...client.requests) < cutoff) {
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Get rate limiter statistics
   * @returns {Object} Statistics
   */
  getStats() {
    let totalRequests = 0;
    let activeClients = 0;
    
    for (const client of this.clients.values()) {
      totalRequests += client.requests.length;
      if (client.requests.length > 0) {
        activeClients++;
      }
    }

    return {
      totalClients: this.clients.size,
      activeClients,
      totalRequests,
      averageRequestsPerClient: activeClients > 0 ? totalRequests / activeClients : 0
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clients.clear();
  }
}

// Export singleton instance
export default new RateLimiter();