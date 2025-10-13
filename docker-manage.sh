#!/bin/bash
# Docker management scripts for Streamyfin Discord Bot

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.docker .env
        print_warning "Please edit .env with your configuration before running the bot"
        exit 1
    fi
}

# Build the Docker image
build() {
    print_status "Building Streamyfin Discord Bot Docker image..."
    docker build -t streamyfin-discord-bot:latest .
    print_success "Docker image built successfully"
}

# Start the bot in production mode
start() {
    check_env_file
    print_status "Starting Streamyfin Discord Bot..."
    docker-compose up -d
    print_success "Bot started successfully"
    print_status "Use 'docker-compose logs -f' to view logs"
}

# Start the bot in development mode
dev() {
    check_env_file
    print_status "Starting Streamyfin Discord Bot in development mode..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
}

# Stop the bot
stop() {
    print_status "Stopping Streamyfin Discord Bot..."
    docker-compose down
    print_success "Bot stopped successfully"
}

# Restart the bot
restart() {
    stop
    start
}

# View logs
logs() {
    docker-compose logs -f streamyfin-discord-bot
}

# Update the bot
update() {
    print_status "Updating Streamyfin Discord Bot..."
    docker-compose pull
    docker-compose up -d
    print_success "Bot updated successfully"
}

# Clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    print_success "Cleanup completed"
}

# Show status
status() {
    print_status "Container status:"
    docker-compose ps
    echo
    print_status "Resource usage:"
    docker stats --no-stream streamyfin-discord-bot streamyfin-redis 2>/dev/null || print_warning "Containers not running"
}

# Backup data
backup() {
    print_status "Creating backup of Redis data..."
    docker-compose exec redis redis-cli BGSAVE
    print_success "Backup initiated"
}

# Show help
help() {
    echo "Streamyfin Discord Bot Docker Management"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  start     Start the bot in production mode"
    echo "  dev       Start the bot in development mode"
    echo "  stop      Stop the bot"
    echo "  restart   Restart the bot"
    echo "  logs      View bot logs"
    echo "  update    Update and restart the bot"
    echo "  cleanup   Clean up Docker resources"
    echo "  status    Show container status"
    echo "  backup    Backup Redis data"
    echo "  help      Show this help message"
    echo
}

# Main command handling
case "${1:-help}" in
    build)
        build
        ;;
    start)
        start
        ;;
    dev)
        dev
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    update)
        update
        ;;
    cleanup)
        cleanup
        ;;
    status)
        status
        ;;
    backup)
        backup
        ;;
    help|*)
        help
        ;;
esac