@echo off
REM SENTINEL Backend Server Startup Script for Windows
REM This script starts the FastAPI backend server on port 8000

echo.
echo ================================
echo SENTINEL Backend Server Startup
echo ================================
echo.

REM Check if we're in the right directory
if not exist "chatbot_app.py" (
    echo ERROR: chatbot_app.py not found. Please run this script from the backend directory.
    pause
    exit /b 1
)

REM Activate virtual environment if it exists
if exist "..\..\delhihack\Scripts\activate.bat" (
    echo Activating virtual environment...
    call ..\..\delhihack\Scripts\activate.bat
    echo Virtual environment activated
) else (
    echo WARNING: Virtual environment not found. Using system Python.
)

REM Check Python version
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python or activate the virtual environment.
    pause
    exit /b 1
)

REM Check if requirements are installed
echo.
echo Checking dependencies...
python -c "import fastapi; import uvicorn; import langchain" 2>nul
if errorlevel 1 (
    echo Installing requirements...
    pip install -r requirements.txt
)

echo.
echo ================================
echo Starting FastAPI Server
echo ================================
echo.
echo Server will run on: http://0.0.0.0:8000
echo API Documentation: http://127.0.0.1:8000/docs
echo ReDoc Documentation: http://127.0.0.1:8000/redoc
echo.
echo To stop the server, press Ctrl+C
echo.

REM Start the server
python -m uvicorn chatbot_app:app --reload --host 0.0.0.0 --port 8000 --log-level info

pause
