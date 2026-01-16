/**
 * Environment validation utilities
 */

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'DISCORD_TOKEN',
  'CLIENT_ID',
  'REPO_ORG',
  'REPO_NAME'
];

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  'REDIS_URL': 'redis://localhost:6379',
  'GITHUB_API_BASE': 'https://api.github.com'
};

/**
 * Validate all environment variables
 * @returns {Object} Validation result with missing variables
 */
export function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional but recommended variables
  if (!process.env.GITHUB_TOKEN) {
    warnings.push('GITHUB_TOKEN not set - GitHub API functionality will be limited');
  }
  
  if (!process.env.AI_APIKEY || !process.env.AI_SUPPORT_URL) {
    warnings.push('AI support not configured - AI features will be disabled');
  }

  if (!process.env.PERSPECTIVE_APIKEY) {
    warnings.push('Perspective API not configured - message moderation will be disabled');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Set default values for optional environment variables
 */
export function setEnvironmentDefaults() {
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }
}

/**
 * Log environment validation results
 * @param {Object} validation - Validation result
 */
export function logValidationResults(validation) {
  if (!validation.isValid) {
    console.error('[ENV] Missing required environment variables:');
    validation.missing.forEach(envVar => {
      console.error(`  - ${envVar}`);
    });
    console.error('[ENV] Please check your .env file or environment configuration');
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn('[ENV] Environment warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }

  console.log('[ENV] Environment validation passed');
}