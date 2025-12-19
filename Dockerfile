
FROM node:18-alpine

# Security & dependencies
RUN apk add --no-cache openssl dumb-init && \
    addgroup -g 1001 -S streamyfin && \
    adduser -S streamyfin -u 1001 -G streamyfin

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Application
COPY --chown=streamyfin:streamyfin . .
RUN mkdir -p /app/logs && chown -R streamyfin:streamyfin /app

USER streamyfin

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node health-check.js

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
