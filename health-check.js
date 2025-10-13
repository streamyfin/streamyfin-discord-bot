#!/usr/bin/env node

/**
 * Health check script for Docker container
 * This script verifies that the bot is running correctly
 */

import { promises as fs } from 'fs';
import process from 'process';

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

async function checkHealth() {
  try {
    // Check if the main process is responsive
    const startTime = Date.now();
    
    // Basic check - ensure we can import our main modules
    await import('./utils/validation.js');
    
    // Check if Redis connection would be available (if configured)
    if (process.env.REDIS_URL) {
      // This is a basic check - in a real scenario you might want to ping Redis
      console.log('Redis URL configured');
    }
    
    // Check if required environment variables are set
    const requiredVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'REPO_ORG', 'REPO_NAME'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.error(`Health check failed: Missing environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`Health check passed in ${elapsed}ms`);
    process.exit(0);
    
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
}

// Set timeout for health check
const timeout = setTimeout(() => {
  console.error('Health check timed out');
  process.exit(1);
}, HEALTH_CHECK_TIMEOUT);

// Run health check
checkHealth().finally(() => {
  clearTimeout(timeout);
});