#!/bin/bash

# SENTINEL Backend Server Startup Script
# This script starts the FastAPI backend server on port 8000

set -e  # Exit on error

echo "════════════════════════════════════════"
echo "  TRINETRA Backend Server"
echo "════════════════════════════════════════"

# Get directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
VENV="$( cd "$PROJECT_ROOT/../delhihack" && pwd )"

# Check for virtual environment
if [ ! -d "$VENV" ]; then
    echo "❌ Virtual environment not found at $VENV"
    exit 1
fi

echo "✓ Virtual environment: $VENV"
source "$VENV/bin/activate"

# Verify activation
if ! command -v python &> /dev/null; then
    echo "❌ Failed to activate virtual environment"
    exit 1
fi

echo "✓ Activated"
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Verify dependencies
echo ""
echo "✓ Checking dependencies..."
if python -c "import fastapi; import uvicorn; import langchain; print('✓ All dependencies loaded')" 2>/dev/null; then
    echo "✓ Dependencies verified"
else
    echo "❌ Dependencies missing. Some features may not work."
fi

echo ""
echo "════════════════════════════════════════"
echo "  Starting FastAPI Server"
echo "════════════════════════════════════════"
echo "🚀 Server: http://127.0.0.1:8000"
echo "📚 Docs:   http://127.0.0.1:8000/docs"
echo "📋 ReDoc:  http://127.0.0.1:8000/redoc"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Set Python path to include project root
export PYTHONPATH="$PROJECT_ROOT:$SCRIPT_DIR:$PYTHONPATH"

# Start the server
cd "$SCRIPT_DIR"
python -m uvicorn app:app --reload --port 8000 --host 127.0.0.1

