
# Multi-stage build for optimized production image
FROM node:22-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

FROM base AS dependencies

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev

FROM base AS build

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Run linting and validation (optional - can be disabled for faster builds)
RUN npm run lint || echo "Linting failed but continuing build"

FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy application files
COPY --from=build --chown=nodejs:nodejs /app .

# Create data directory for logs and cache
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node health-check.js

# Environment variables
ENV NODE_ENV=production \
    LOG_LEVEL=INFO \
    REDIS_URL=redis://redis:6379

# Expose port (for potential future web interface)
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
