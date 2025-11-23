/**
 * Production error handling middleware
 */

import Logger from './logger.js';

const logger = new Logger('ERROR_HANDLER');

/**
 * Production-safe error handler that prevents sensitive information leakage
 * @param {Error} error - Error to handle
 * @param {string} context - Context where error occurred
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Safe error object for user display
 */
export function handleError(error, context = 'Unknown', metadata = {}) {
  // Log full error details for debugging
  logger.error(`[${context}] ${error.message}`, {
    stack: error.stack,
    ...metadata
  });

  // Return safe error message for production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An error occurred. Please try again later.',
      code: 'INTERNAL_ERROR'
    };
  }

  // Development mode - return more details
  return {
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    stack: error.stack
  };
}

/**
 * Async error wrapper for Discord interaction handlers
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler with error handling
 */
export function withErrorHandling(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      const safeError = handleError(error, 'InteractionHandler');
      logger.error('Interaction handler failed:', safeError);
      throw error; // Re-throw for Discord.js to handle
    }
  };
}

/**
 * Create production-safe error response for Discord interactions
 * @param {Error} error - Original error
 * @param {string} context - Context information
 * @returns {Object} Discord interaction response
 */
export function createErrorResponse(error, context) {
  const safeError = handleError(error, context);
  
  return {
    content: safeError.message,
    flags: 64, // MessageFlags.Ephemeral
  };
}

export default { handleError, withErrorHandling, createErrorResponse };