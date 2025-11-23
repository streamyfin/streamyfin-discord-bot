/**
 * Production-ready environment configuration
 */

// Security configurations for production
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10, // Max requests per window
  
  // Request timeouts
  API_TIMEOUT: 30000, // 30 seconds
  HTTP_TIMEOUT: 15000, // 15 seconds
  
  // Redis configurations
  REDIS_RETRY_ATTEMPTS: 3,
  REDIS_RETRY_DELAY: 1000, // 1 second
  
  // Discord configurations
  DISCORD_MAX_RETRIES: 3,
  COMMAND_COOLDOWN: 3000, // 3 seconds
  
  // Memory thresholds
  MEMORY_WARNING_THRESHOLD: 400, // MB
  MEMORY_CRITICAL_THRESHOLD: 512, // MB
};

// Production environment variables validation
export const PRODUCTION_ENV_REQUIREMENTS = {
  required: [
    'DISCORD_TOKEN',
    'CLIENT_ID',
    'REPO_ORG',
    'REPO_NAME',
    'REDIS_URL'
  ],
  recommended: [
    'GITHUB_TOKEN',
    'AI_APIKEY',
    'AI_SUPPORT_URL',
    'PERSPECTIVE_APIKEY',
    'LOG_LEVEL'
  ],
  security: [
    'NODE_ENV',
    'WEB_PANEL_PORT',
    'ENABLE_METRICS'
  ]
};

// Logging configuration for production
export const LOG_CONFIG = {
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  colors: {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[90m'  // Gray
  },
  reset: '\x1b[0m'
};

// API retry configurations
export const RETRY_CONFIG = {
  github: {
    retries: 3,
    retryDelay: 1000,
    exponentialBase: 2,
    maxDelay: 10000
  },
  discord: {
    retries: 2,
    retryDelay: 500,
    exponentialBase: 2,
    maxDelay: 5000
  },
  ai: {
    retries: 2,
    retryDelay: 2000,
    exponentialBase: 1.5,
    maxDelay: 8000
  }
};

// Default values for production
export const PRODUCTION_DEFAULTS = {
  LOG_LEVEL: 'INFO',
  NODE_ENV: 'production',
  REDIS_URL: 'redis://redis:6379',
  WEB_PANEL_PORT: 3000,
  ENABLE_METRICS: 'true',
  ENABLE_RATE_LIMITING: 'true',
  METRICS_RETENTION_HOURS: '24'
};

/**
 * Validate production environment
 * @returns {Object} Validation result
 */
export function validateProductionEnvironment() {
  const missing = [];
  const warnings = [];
  const errors = [];

  // Check required variables
  PRODUCTION_ENV_REQUIREMENTS.required.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  // Check recommended variables
  PRODUCTION_ENV_REQUIREMENTS.recommended.forEach(envVar => {
    if (!process.env[envVar]) {
      warnings.push(`${envVar} not set - some features may be limited`);
    }
  });

  // Validate critical production settings
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not set to "production"');
  }

  // Validate numeric values
  const numericEnvs = {
    WEB_PANEL_PORT: 'number',
    METRICS_RETENTION_HOURS: 'number'
  };

  Object.entries(numericEnvs).forEach(([envVar, type]) => {
    if (process.env[envVar] && isNaN(Number(process.env[envVar]))) {
      errors.push(`${envVar} must be a valid ${type}`);
    }
  });

  // Validate URLs
  const urlEnvs = ['REDIS_URL', 'AI_SUPPORT_URL', 'GITHUB_API_BASE'];
  urlEnvs.forEach(envVar => {
    if (process.env[envVar]) {
      try {
         
        new globalThis.URL(process.env[envVar]);
      } catch (_error) {
        errors.push(`${envVar} is not a valid URL`);
      }
    }
  });

  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    warnings,
    errors
  };
}

/**
 * Apply production defaults
 */
export function applyProductionDefaults() {
  Object.entries(PRODUCTION_DEFAULTS).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

export default {
  SECURITY_CONFIG,
  PRODUCTION_ENV_REQUIREMENTS,
  LOG_CONFIG,
  RETRY_CONFIG,
  PRODUCTION_DEFAULTS,
  validateProductionEnvironment,
  applyProductionDefaults
};