#!/bin/bash

# ========================================================================================
# TRINETRA Docker Quick Start Script
# ========================================================================================
# This script provides quick commands for common Docker operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
}

# Function to use the correct docker compose command
docker_compose_cmd() {
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Main menu
show_menu() {
    echo "=================================================================================="
    echo "  TRINETRA Cyber Defense - Docker Quick Start"
    echo "=================================================================================="
    echo ""
    echo "Available commands:"
    echo "  1) Start services (development)"
    echo "  2) Start services (production)"
    echo "  3) Stop services"
    echo "  4) View logs"
    echo "  5) Rebuild images"
    echo "  6) Clean up containers and volumes"
    echo "  7) Check service status"
    echo "  8) Access shell in container"
    echo "  9) Run tests"
    echo "  0) Exit"
    echo ""
    read -p "Choose an option (0-9): " choice
}

# Start development services
start_dev() {
    print_info "Starting TRINETRA services in development mode..."
    $(docker_compose_cmd) --env-file .env up -d
    print_success "Services started!"
    print_info "Frontend: http://localhost:80"
    print_info "Backend API: http://localhost:8000"
    print_info "API Docs: http://localhost:8000/docs"
}

# Start production services
start_prod() {
    if [ ! -f ".env.prod" ]; then
        print_error ".env.prod file not found. Please create it from .env.prod template."
        exit 1
    fi
    print_info "Starting TRINETRA services in production mode..."
    $(docker_compose_cmd) -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
    print_success "Production services started!"
}

# Stop services
stop_services() {
    print_info "Stopping TRINETRA services..."
    $(docker_compose_cmd) down
    print_success "Services stopped!"
}

# View logs
view_logs() {
    echo "Available services:"
    echo "  1) All services"
    echo "  2) Backend only"
    echo "  3) Frontend only"
    echo "  4) Redis only"
    read -p "Choose service (1-4): " service_choice

    case $service_choice in
        1) $(docker_compose_cmd) logs -f ;;
        2) $(docker_compose_cmd) logs -f backend ;;
        3) $(docker_compose_cmd) logs -f frontend ;;
        4) $(docker_compose_cmd) logs -f redis ;;
        *) print_error "Invalid choice" ;;
    esac
}

# Rebuild images
rebuild_images() {
    print_info "Rebuilding Docker images..."
    $(docker_compose_cmd) build --no-cache
    print_success "Images rebuilt!"
}

# Clean up
cleanup() {
    print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
    read -p "" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up containers and volumes..."
        $(docker_compose_cmd) down -v
        docker system prune -f
        print_success "Cleanup completed!"
    fi
}

# Check status
check_status() {
    print_info "Service status:"
    $(docker_compose_cmd) ps
    echo ""
    print_info "Health checks:"
    echo "Frontend health: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "N/A")"
    echo "Backend health: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "N/A")"
}

# Access shell
access_shell() {
    echo "Available containers:"
    echo "  1) Backend"
    echo "  2) Frontend"
    echo "  3) Redis"
    read -p "Choose container (1-3): " container_choice

    case $container_choice in
        1) $(docker_compose_cmd) exec backend sh ;;
        2) $(docker_compose_cmd) exec frontend sh ;;
        3) $(docker_compose_cmd) exec redis sh ;;
        *) print_error "Invalid choice" ;;
    esac
}

# Run tests
run_tests() {
    print_info "Running tests..."
    # Add your test commands here
    print_warning "Test functionality not yet implemented"
}

# Main script
main() {
    check_docker
    check_docker_compose

    while true; do
        show_menu

        case $choice in
            1) start_dev ;;
            2) start_prod ;;
            3) stop_services ;;
            4) view_logs ;;
            5) rebuild_images ;;
            6) cleanup ;;
            7) check_status ;;
            8) access_shell ;;
            9) run_tests ;;
            0) print_info "Goodbye!"; exit 0 ;;
            *) print_error "Invalid option. Please choose 0-9." ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
        clear
    done
}

# Run main function
main "$@"