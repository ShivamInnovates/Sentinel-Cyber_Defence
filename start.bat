@echo off
setlocal enabledelayedexpansion

:: ========================================================================================
:: TRINETRA Cyber Defense - Universal Entry Point (Windows)
:: ========================================================================================

cls
echo ==================================================================================
echo   TRINETRA Cyber Defense System - Startup
echo ==================================================================================
echo.
echo TRINETRA can be run in two ways:
echo.
echo 1) DOCKER (Recommended)
echo    - Easiest setup, avoids all dependency issues.
echo    - Requires Docker Desktop.
echo.
echo 2) NATIVE (Manual setup)
echo    - Run servers directly on your machine.
echo    - Requires Python 3.11+ and Node.js.
echo    - Note: Native installation on Windows may have dependency issues.
echo.
echo 0) Exit
echo.

set /p choice="Choose launch method (1-2): "

if "%choice%"=="1" (
    if exist "docker-start.bat" (
        call docker-start.bat
    ) else (
        echo ERROR: docker-start.bat not found.
        pause
    )
    exit /b
)

if "%choice%"=="2" (
    echo.
    echo To run natively, please follow the instructions in QUICK_START.md
    echo Or run backend/start_server.bat directly.
    echo.
    set /p confirm="Do you want to try running the backend server now? (y/n): "
    if /i "!confirm!"=="y" (
        if exist "backend\start_server.bat" (
            cd backend
            call start_server.bat
        ) else (
            echo ERROR: backend\start_server.bat not found.
            pause
        )
    )
    exit /b
)

if "%choice%"=="0" exit /b

goto :MENU
