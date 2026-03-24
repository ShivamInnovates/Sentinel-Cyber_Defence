#!/bin/bash

# SENTINEL Backend Server Startup Script
# This script starts the FastAPI backend server on port 8000

set -e  # Exit on error

echo "================================"
echo "SENTINEL Backend Server Startup"
echo "================================"

# Check if we're in the right directory
if [ ! -f "chatbot_app.py" ]; then
    echo "ERROR: chatbot_app.py not found. Please run this script from the backend directory."
    exit 1
fi

# Determine if we should use the virtual environment
if [ -d "../../delhihack" ]; then
    echo "✓ Found virtual environment at ../../delhihack"
    source ../../delhihack/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "⚠ Virtual environment not found. Using system Python."
fi

# Check Python version
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Check if requirements are installed
echo "✓ Checking dependencies..."
if ! python -c "import fastapi; import uvicorn; import langchain" 2>/dev/null; then
    echo "⚠ Installing requirements..."
    pip install -r requirements.txt
fi

echo ""
echo "================================"
echo "Starting FastAPI Server"
echo "================================"
echo "🚀 Server will run on: http://0.0.0.0:8000"
echo "📝 API Documentation: http://127.0.0.1:8000/docs"
echo "📋 ReDoc Documentation: http://127.0.0.1:8000/redoc"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

# Start the server
python -m uvicorn chatbot_app:app --reload --host 0.0.0.0 --port 8000 --log-level info
