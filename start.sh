#!/bin/bash

# ========================================================================================
# TRINETRA Cyber Defense - Universal Entry Point (Linux/macOS/WSL)
# ========================================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear
echo -e "${GREEN}==================================================================================${NC}"
echo -e "${GREEN}   TRINETRA Cyber Defense System - Startup                                      ${NC}"
echo -e "${GREEN}==================================================================================${NC}"
echo
echo "TRINETRA can be run in two ways:"
echo
echo -e "1) ${GREEN}DOCKER (Recommended)${NC}"
echo "   - Easiest setup, avoids all dependency issues."
echo "   - Requires Docker installed."
echo
echo -e "2) ${YELLOW}NATIVE (Manual setup)${NC}"
echo "   - Run servers directly on your machine."
echo "   - Requires Python 3.11+ and Node.js."
echo
echo "0) Exit"
echo

read -p "Choose launch method (1-2): " choice

case $choice in
    1)
        if [ -f "docker-quickstart.sh" ]; then
            chmod +x docker-quickstart.sh
            ./docker-quickstart.sh
        else
            echo -e "${RED}ERROR: docker-quickstart.sh not found.${NC}"
        fi
        ;;
    2)
        echo
        echo "To run natively, please follow the instructions in QUICK_START.md"
        echo "Or run backend/start_server.sh directly."
        echo
        read -p "Do you want to try running the backend server now? (y/n): " confirm
        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            if [ -f "backend/start_server.sh" ]; then
                cd backend
                chmod +x start_server.sh
                ./start_server.sh
            else
                echo -e "${RED}ERROR: backend/start_server.sh not found.${NC}"
            fi
        fi
        ;;
    0)
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
