#!/bin/bash

# ========================================================================================
# TRINETRA Docker Quick Start Script (Linux/macOS/WSL)
# ========================================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to show logo
show_logo() {
    clear
    echo -e "${GREEN}==================================================================================${NC}"
    echo -e "${GREEN}   TRINETRA Cyber Defense - Docker Quick Start (Linux/WSL)                      ${NC}"
    echo -e "${GREEN}==================================================================================${NC}"
    echo
}

# Check for Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}ERROR: Docker is not installed.${NC}"
        echo "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}ERROR: Docker is not running or you don't have permissions.${NC}"
        echo "Please start Docker and ensure your user is in the 'docker' group."
        exit 1
    fi
}

# Check for .env file
check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}WARNING: .env file not found.${NC}"
        if [ -f .env.example ]; then
            echo "Creating .env from .env.example..."
            cp .env.example .env
            echo -e "${GREEN}.env created!${NC}"
        else
            echo -e "${RED}ERROR: .env.example not found.${NC}"
            exit 1
        fi
    fi
}

# Main Menu
show_menu() {
    show_logo
    echo "Available commands:"
    echo "  1) Start services (development)"
    echo "  2) Start services (production)"
    echo "  3) Stop services"
    echo "  4) Rebuild images"
    echo "  5) View logs"
    echo "  6) Clean up containers and volumes"
    echo "  7) Check service status"
    echo "  0) Exit"
    echo
    read -p "Choose an option (0-7): " choice
    case $choice in
        1) start_dev ;;
        2) start_prod ;;
        3) stop_services ;;
        4) rebuild_images ;;
        5) view_logs ;;
        6) cleanup ;;
        7) check_status ;;
        0) exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}"; sleep 1; show_menu ;;
    esac
}

start_dev() {
    echo -e "${YELLOW}Starting TRINETRA services in development mode...${NC}"
    docker compose --env-file .env up -d
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}[SUCCESS] Services started!${NC}"
        echo "Frontend: http://localhost:80"
        echo "Backend API: http://localhost:8000"
    else
        echo -e "\n${RED}[ERROR] Failed to start services.${NC}"
    fi
    read -p "Press Enter to continue..."
    show_menu
}

start_prod() {
    if [ ! -f .env.prod ]; then
        echo -e "${YELLOW}WARNING: .env.prod not found.${NC}"
        if [ -f .env.example ]; then
            cp .env.example .env.prod
            echo "Created .env.prod from example. Please update it for production."
        fi
    fi
    echo -e "${YELLOW}Starting TRINETRA services in production mode...${NC}"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}[SUCCESS] Production services started!${NC}"
    else
        echo -e "\n${RED}[ERROR] Failed to start production services.${NC}"
    fi
    read -p "Press Enter to continue..."
    show_menu
}

stop_services() {
    echo -e "${YELLOW}Stopping TRINETRA services...${NC}"
    docker compose down
    echo -e "${GREEN}Services stopped!${NC}"
    read -p "Press Enter to continue..."
    show_menu
}

rebuild_images() {
    echo -e "${YELLOW}Rebuilding Docker images...${NC}"
    docker compose build --no-cache
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Images rebuilt!${NC}"
    else
        echo -e "${RED}Build failed.${NC}"
    fi
    read -p "Press Enter to continue..."
    show_menu
}

view_logs() {
    echo
    echo "Available services:"
    echo "  1) All services"
    echo "  2) Backend only"
    echo "  3) Frontend only"
    echo "  4) Redis only"
    read -p "Choose service (1-4): " log_choice
    case $log_choice in
        1) docker compose logs -f ;;
        2) docker compose logs -f backend ;;
        3) docker compose logs -f frontend ;;
        4) docker compose logs -f redis ;;
    esac
    show_menu
}

cleanup() {
    echo -e "${RED}WARNING: This will remove ALL containers and volumes for TRINETRA.${NC}"
    read -p "Are you sure? (y/n): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        docker compose down -v
        echo -e "${GREEN}Cleanup completed!${NC}"
    fi
    read -p "Press Enter to continue..."
    show_menu
}

check_status() {
    echo -e "${YELLOW}Service status:${NC}"
    docker compose ps
    echo
    read -p "Press Enter to continue..."
    show_menu
}

# Execution starts here
check_docker
check_env
show_menu
