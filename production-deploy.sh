#!/bin/bash

# Production deployment and management script
# Usage: ./production-deploy.sh [command]

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
ENV_FILE="${PROJECT_DIR}/.env"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
}

# Check if environment file exists
check_environment() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found. Creating from example..."
        if [ -f "${PROJECT_DIR}/.env.prod.example" ]; then
            cp "${PROJECT_DIR}/.env.prod.example" "$ENV_FILE"
            log_warning "Please edit $ENV_FILE with your configuration"
            exit 1
        else
            log_error "No environment example file found"
            exit 1
        fi
    fi
}

# Validate production environment
validate_environment() {
    log_info "Validating production environment..."
    
    # Check required environment variables
    required_vars=(
        "DISCORD_TOKEN"
        "CLIENT_ID"
        "REPO_ORG"
        "REPO_NAME"
        "REDIS_URL"
    )
    
    missing_vars=()
    
    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    fi
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        printf '  - %s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Build production image
build() {
    log_info "Building production Docker image..."
    docker compose -f "$COMPOSE_FILE" build
    log_success "Build completed"
}

# Deploy to production
deploy() {
    log_info "Deploying to production..."
    
    # Check if already running
    if docker compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
        log_info "Stopping existing deployment..."
        docker compose -f "$COMPOSE_FILE" down
    fi
    
    # Start services
    docker compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Check health
    if check_health; then
        log_success "Deployment successful"
        show_status
    else
        log_error "Deployment failed - services not healthy"
        docker compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
}

# Check service health
check_health() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T streamyfin-bot node health-check.js &>/dev/null; then
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 2
        ((attempt++))
    done
    
    return 1
}

# Show deployment status
show_status() {
    log_info "Service Status:"
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
        $(docker compose -f "$COMPOSE_FILE" ps -q)
}

# Show logs
show_logs() {
    local service="${1:-streamyfin-bot}"
    local lines="${2:-50}"
    
    log_info "Showing last $lines lines of logs for $service:"
    docker compose -f "$COMPOSE_FILE" logs --tail="$lines" -f "$service"
}

# Update deployment
update() {
    log_info "Updating deployment..."
    
    # Pull latest changes
    git pull origin main
    
    # Rebuild and redeploy
    build
    deploy
}

# Backup data
backup() {
    local backup_dir="${PROJECT_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    log_info "Creating backup in $backup_dir"
    
    # Backup environment
    cp "$ENV_FILE" "$backup_dir/env.backup"
    
    # Backup Redis data
    docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli BGSAVE
    docker cp "$(docker compose -f "$COMPOSE_FILE" ps -q redis):/data/dump.rdb" "$backup_dir/"
    
    log_success "Backup completed: $backup_dir"
}

# Cleanup old backups and unused images
cleanup() {
    log_info "Cleaning up old backups and unused Docker resources..."
    
    # Remove backups older than 7 days
    if [ -d "${PROJECT_DIR}/backups" ]; then
        find "${PROJECT_DIR}/backups" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    fi
    
    # Clean Docker resources
    docker system prune -f
    docker image prune -f
    
    log_success "Cleanup completed"
}

# Stop services
stop() {
    log_info "Stopping services..."
    docker compose -f "$COMPOSE_FILE" down
    log_success "Services stopped"
}

# Restart services
restart() {
    stop
    sleep 5
    deploy
}

# Show metrics
metrics() {
    if docker compose -f "$COMPOSE_FILE" ps -q streamyfin-bot | grep -q .; then
        local container_id=$(docker compose -f "$COMPOSE_FILE" ps -q streamyfin-bot)
        local web_panel_port=$(docker port "$container_id" 3000 | cut -d':' -f2)
        
        if [ -n "$web_panel_port" ]; then
            log_info "Bot metrics available at: http://localhost:$web_panel_port/metrics"
            curl -s "http://localhost:$web_panel_port/health" | jq . 2>/dev/null || \
            curl -s "http://localhost:$web_panel_port/health"
        else
            log_error "Web panel port not found"
        fi
    else
        log_error "Bot container is not running"
    fi
}

# Show help
help() {
    echo "Production Deployment Script for Streamyfin Discord Bot"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy      - Deploy to production"
    echo "  build       - Build production Docker image"
    echo "  status      - Show deployment status"
    echo "  logs        - Show service logs"
    echo "  update      - Update and redeploy"
    echo "  backup      - Backup data"
    echo "  cleanup     - Cleanup old data and images"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  metrics     - Show bot metrics"
    echo "  health      - Check service health"
    echo "  help        - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                    # Deploy to production"
    echo "  $0 logs streamyfin-bot 100   # Show last 100 lines of bot logs"
    echo "  $0 backup                    # Create backup"
}

# Main script logic
main() {
    case "${1:-help}" in
        deploy)
            check_docker
            check_environment
            validate_environment
            build
            deploy
            ;;
        build)
            check_docker
            build
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2" "$3"
            ;;
        update)
            check_docker
            check_environment
            validate_environment
            update
            ;;
        backup)
            check_docker
            backup
            ;;
        cleanup)
            cleanup
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        metrics)
            metrics
            ;;
        health)
            if check_health; then
                log_success "All services are healthy"
            else
                log_error "Some services are not healthy"
                exit 1
            fi
            ;;
        help|--help|-h)
            help
            ;;
        *)
            log_error "Unknown command: $1"
            help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"