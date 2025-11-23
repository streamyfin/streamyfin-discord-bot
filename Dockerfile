
FROM node:22-alpine AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy application files
COPY --chown=nodejs:nodejs . .

# Install production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Create data directory and set permissions
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

# Remove development files
RUN rm -rf \
    .git \
    .github \
    .gitignore \
    .env.example \
    .env.prod.example \
    README.md \
    TODO.md \
    docs/ \
    oldIndex.js

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node health-check.js

# Environment variables
ENV NODE_ENV=production \
    LOG_LEVEL=INFO \
    ENABLE_METRICS=true \
    WEB_PANEL_PORT=3000

# Expose port for web dashboard
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
