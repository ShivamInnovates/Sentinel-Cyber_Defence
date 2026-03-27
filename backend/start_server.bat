@echo off
setlocal enabledelayedexpansion

:: ========================================================================================
:: SENTINEL Backend Server - Operations Menu
:: ========================================================================================

cd /d "%~dp0"

:MENU
cls
echo.
echo ================================
echo  SENTINEL Backend  ^|  Port 8000
echo ================================
echo.
echo   1) Start Server
echo   2) Reinstall Dependencies
echo   3) Clear Vectorstore Cache
echo   4) Rebuild Virtual Environment
echo   5) Check Python + Dependency Status
echo.
echo   0) Exit
echo.
set /p choice="Choose an option: "

if "%choice%"=="1" goto :START
if "%choice%"=="2" goto :REINSTALL
if "%choice%"=="3" goto :CLEAR_CACHE
if "%choice%"=="4" goto :REBUILD_VENV
if "%choice%"=="5" goto :STATUS
if "%choice%"=="0" exit /b
echo Invalid choice.
pause
goto :MENU


:START
:: ---- Activate or create venv ----
if not exist "venv\Scripts\activate.bat" (
    echo Creating virtual environment using Windows Python Launcher...
    py -m venv venv
)
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Virtual environment activated.

echo Upgrading pip and build tools to avoid C++ compiler errors...
python -m pip install --upgrade pip setuptools wheel

:: ---- Check Python ----
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python or activate the virtual environment.
    pause
    goto :MENU
)

:: ---- Install deps if missing ----
echo.
echo Checking dependencies...
python -c "import fastapi; import uvicorn; import langchain; import greenlet; import langchain_community; import langchain_huggingface" 2>nul
if errorlevel 1 (
    echo Installing requirements...
    python -m pip install -r requirements.txt
)

echo.
echo ================================
echo  Starting FastAPI Server
echo ================================
echo.
echo   Backend API  : http://0.0.0.0:8000
echo   Swagger Docs : http://127.0.0.1:8000/docs
echo   ReDoc        : http://127.0.0.1:8000/redoc
echo.
echo   Press Ctrl+C to stop the server.
echo.

python -m uvicorn chatbot_app:app --reload --host 0.0.0.0 --port 8000 --log-level info

echo.
echo Server stopped.
pause
goto :MENU


:REINSTALL
echo Activating virtual environment...
call venv\Scripts\activate.bat 2>nul
echo.
echo Reinstalling all requirements...
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
echo.
echo Done.
pause
goto :MENU


:CLEAR_CACHE
echo.
if exist "sentinel_vectorstore" (
    echo Deleting vectorstore cache...
    rmdir /s /q sentinel_vectorstore
    echo Vectorstore cache cleared.
) else (
    echo No vectorstore cache found.
)
echo.
pause
goto :MENU


:REBUILD_VENV
echo.
echo WARNING: This will delete and recreate the virtual environment.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto :MENU

echo Deleting venv...
if exist "venv" rmdir /s /q venv

echo Creating new virtual environment...
py -m venv venv
call venv\Scripts\activate.bat
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
echo.
echo Virtual environment rebuilt successfully.
pause
goto :MENU


:STATUS
call venv\Scripts\activate.bat 2>nul
python --version
echo.
echo Installed packages:
python -m pip list
echo.
pause
goto :MENU
