@echo off
setlocal enabledelayedexpansion

:MENU
cls
echo ==================================================================================
echo   SENTINEL Cyber Defense System - Startup
echo ==================================================================================
echo.
echo   1) NATIVE  - Launch backend + frontend on this machine
echo              - Requires Python 3.11+ and Node.js
echo.
echo   2) DOCKER  - Launch via Docker (Recommended for clean setup)
echo              - Requires Docker Desktop to be running
echo.
echo   0) Exit
echo.
set /p choice="Choose launch method (0-2): "

if "%choice%"=="0" exit /b
if "%choice%"=="1" goto NATIVE
if "%choice%"=="2" goto DOCKER
echo Invalid choice. Please enter 0, 1, or 2.
pause
goto MENU


:NATIVE
cls
echo ==================================================================================
echo   SENTINEL - Native Mode
echo ==================================================================================
echo.

where py >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python Launcher "py" not found.
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    goto MENU
)

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not found.
    echo Please install Node.js from https://nodejs.org/
    pause
    goto MENU
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm not found. Please reinstall Node.js.
    pause
    goto MENU
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    if errorlevel 1 (
        echo ERROR: npm install failed. Check Node.js installation.
        cd ..
        pause
        goto MENU
    )
    cd ..
    echo Frontend dependencies installed.
)

echo.
echo Starting backend server in a new window...
start "SENTINEL Backend :8000" cmd /k "cd /d %~dp0backend && call start_server.bat"

timeout /t 3 /nobreak >nul

echo Starting frontend dev server in a new window...
start "SENTINEL Frontend :5173" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==================================================================================
echo   Both servers are starting!
echo ==================================================================================
echo.
echo   Backend API  : http://localhost:8000
echo   API Docs     : http://localhost:8000/docs
echo   Frontend     : http://localhost:5173
echo.
echo   Tip: Close the opened terminal windows to stop the servers.
echo ==================================================================================
echo.
pause
goto MENU


:DOCKER
if not exist "docker-start.bat" (
    echo ERROR: docker-start.bat not found.
    pause
    goto MENU
)
call docker-start.bat
goto MENU
