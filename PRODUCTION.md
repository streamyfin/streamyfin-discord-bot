# Production Deployment Guide

## Prerequisites

### Environment Variables
Required for production deployment:

```env
# Core Discord Configuration
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
REPO_ORG=streamyfin
REPO_NAME=streamyfin

# Redis Configuration
REDIS_URL=redis://redis:6379

# GitHub Integration (Recommended)
GITHUB_TOKEN=your_github_token
GITHUB_API_BASE=https://api.github.com

# AI Support (Optional)
AI_APIKEY=your_ai_api_key
AI_SUPPORT_URL=https://your-ai-service.com

# Moderation (Optional)
PERSPECTIVE_APIKEY=your_perspective_api_key

# Production Settings
NODE_ENV=production
LOG_LEVEL=INFO
ENABLE_METRICS=true
ENABLE_WEB_PANEL=true
WEB_PANEL_PORT=3000
METRICS_RETENTION_HOURS=24
```

### System Requirements

- **Memory**: Minimum 512MB RAM, recommended 1GB+
- **CPU**: 1 core minimum, 2+ cores recommended for high traffic
- **Storage**: Minimum 1GB for logs and cache
- **Node.js**: Version 18+ (LTS recommended)
- **Redis**: Version 6+ for caching and session storage

## Docker Production Deployment

### Using Docker Compose

1. **Production Setup**:
```bash
# Clone the repository
git clone https://github.com/streamyfin/streamyfin-discord-bot.git
cd streamyfin-discord-bot

# Copy environment file
cp .env.prod.example .env

# Edit environment variables
nano .env
```

2. **Deploy with Docker Compose**:
```bash
# Start production services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f streamyfin-bot

# Check status
docker compose -f docker-compose.prod.yml ps
```

3. **Production Docker Compose**:
```yaml
services:
  streamyfin-bot:
    build:
      context: .
      target: production
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  redis_data:
```

## Security Best Practices

### 1. Environment Security
- Use strong, unique tokens and API keys
- Rotate credentials regularly
- Store sensitive data in secure environment variables
- Never commit secrets to version control

### 2. Network Security
```yaml
# Production network configuration
networks:
  streamyfin-network:
    driver: bridge
    internal: true  # Restrict external access

services:
  streamyfin-bot:
    networks:
      - streamyfin-network
    # Only expose necessary ports
    ports:
      - "127.0.0.1:3000:3000"  # Bind to localhost only
```

### 3. Container Security
- Run as non-root user (already configured)
- Use minimal base images (alpine)
- Regular security updates
- Scan images for vulnerabilities

## Monitoring & Observability

### 1. Health Checks
The bot includes automated health checks:
- Memory usage monitoring
- Redis connectivity
- Error rate tracking
- Uptime monitoring

### 2. Metrics Collection
Access metrics via web panel at `http://localhost:3000/metrics`:
```json
{
  "uptime": 3600000,
  "memoryUsageMB": 128,
  "commandsExecuted": 1250,
  "errorsCount": 3,
  "errorRate": "0.24",
  "status": "healthy"
}
```

### 3. Logging
Structured JSON logging for production:
```bash
# View real-time logs
docker logs -f streamyfin-bot

# Export logs for analysis
docker logs streamyfin-bot > bot-logs.txt
```

## Performance Optimization

### 1. Memory Management
- Automatic memory monitoring with alerts
- Redis connection pooling
- Cleanup intervals for rate limiting
- Garbage collection optimization

### 2. Rate Limiting
Built-in rate limiting protects against abuse:
- 10 requests per minute per user (default)
- Configurable limits per command
- Automatic penalty system for violations

### 3. Caching Strategy
- Redis for session storage
- In-memory caching for frequently accessed data
- TTL-based cache invalidation
- Metrics caching for dashboard

## Backup & Recovery

### 1. Data Backup
```bash
# Backup Redis data
docker exec redis redis-cli BGSAVE

# Backup bot configuration
cp .env .env.backup.$(date +%Y%m%d)
```

### 2. Recovery Procedures
```bash
# Restore from backup
docker compose -f docker-compose.prod.yml down
# Restore Redis data and configuration
docker compose -f docker-compose.prod.yml up -d
```

## Scaling Considerations

### 1. Horizontal Scaling
For high-traffic deployments:
- Use Redis Cluster for session sharing
- Load balancer for web panel
- Multiple bot instances with shard management

### 2. Resource Monitoring
Monitor these metrics:
- **CPU Usage**: Keep below 70% average
- **Memory**: Alert at 400MB, critical at 512MB
- **Discord API Rate Limits**: Monitor 429 responses
- **Redis Performance**: Monitor latency and memory

## Troubleshooting

### Common Issues

1. **Bot Not Responding**:
```bash
# Check container status
docker ps
docker logs streamyfin-bot

# Restart if needed
docker restart streamyfin-bot
```

2. **High Memory Usage**:
```bash
# Check metrics
curl http://localhost:3000/health

# Restart container
docker restart streamyfin-bot
```

3. **Redis Connection Issues**:
```bash
# Test Redis connectivity
docker exec redis redis-cli ping

# Check Redis logs
docker logs redis
```

### Support & Maintenance

- Monitor error rates via web dashboard
- Set up alerts for critical metrics
- Regular dependency updates
- Automated backups
- Performance testing

## Security Alerts

Set up monitoring for:
- Unusual error patterns
- High resource usage
- Failed authentication attempts
- Rate limit violations
- External API failures

This production setup ensures high availability, security, and performance for the Streamyfin Discord Bot.