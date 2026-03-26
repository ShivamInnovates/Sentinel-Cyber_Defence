@echo off
setlocal enabledelayedexpansion

:: ========================================================================================
:: TRINETRA Docker Quick Start Script (Windows Batch)
:: ========================================================================================

:CHECK_DOCKER
echo Checking for Docker installation...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in your PATH.
    echo Please install Docker Desktop for Windows: https://docs.docker.com/desktop/install/windows/
    pause
    exit /b 1
)

echo Checking if Docker is running...
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running.
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

:CHECK_ENV
if not exist .env (
    echo WARNING: .env file not found.
    if exist .env.example (
        echo Creating .env from .env.example...
        copy .env.example .env >nul
        echo .env created! Please review it if needed.
    ) else (
        echo ERROR: .env.example not found. Cannot create .env file.
        pause
        exit /b 1
    )
)

:MENU
cls
echo ==================================================================================
echo   TRINETRA Cyber Defense - Docker Quick Start (Windows)
echo ==================================================================================
echo.
echo Available commands:
echo   1) Start services (development)
echo   2) Start services (production)
echo   3) Stop services
echo   4) Rebuild images
echo   5) View logs
echo   6) Clean up containers and volumes
echo   7) Check service status
echo   0) Exit
echo.
set /p choice="Choose an option (0-7): "

if "%choice%"=="1" goto START_DEV
if "%choice%"=="2" goto START_PROD
if "%choice%"=="3" goto STOP
if "%choice%"=="4" goto BUILD
if "%choice%"=="5" goto LOGS
if "%choice%"=="6" goto CLEAN
if "%choice%"=="7" goto STATUS
if "%choice%"=="0" exit /b
goto MENU

:START_DEV
echo Starting TRINETRA services in development mode...
docker compose --env-file .env up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start services. Check the logs above.
    pause
    goto MENU
)
echo.
echo [SUCCESS] Services started!
echo Frontend: http://localhost:80
echo Backend API: http://localhost:8000
echo.
pause
goto MENU

:START_PROD
if not exist .env.prod (
    echo WARNING: .env.prod file not found.
    if exist .env.example (
        echo Creating .env.prod from .env.example...
        copy .env.example .env.prod >nul
        echo .env.prod created! Please update it for production use.
    ) else (
        echo ERROR: .env.example not found.
        pause
        goto MENU
    )
)
echo Starting TRINETRA services in production mode...
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start production services.
    pause
    goto MENU
)
echo [SUCCESS] Production services started!
pause
goto MENU

:STOP
echo Stopping TRINETRA services...
docker compose down
echo Services stopped!
pause
goto MENU

:LOGS
echo.
echo Available services:
echo   1) All services
echo   2) Backend only
echo   3) Frontend only
echo   4) Redis only
set /p log_choice="Choose service (1-4): "
if "%log_choice%"=="1" docker compose logs -f
if "%log_choice%"=="2" docker compose logs -f backend
if "%log_choice%"=="3" docker compose logs -f frontend
if "%log_choice%"=="4" docker compose logs -f redis
goto MENU

:BUILD
echo Rebuilding Docker images...
docker compose build --no-cache
if %errorlevel% neq 0 (
    echo ERROR: Build failed.
    pause
    goto MENU
)
echo Images rebuilt!
pause
goto MENU

:CLEAN
echo WARNING: This will remove ALL containers and volumes for TRINETRA.
set /p confirm="Are you sure? (y/n): "
if /i "%confirm%"=="y" (
    docker compose down -v
    echo Cleanup completed!
)
pause
goto MENU

:STATUS
echo Service status:
docker compose ps
echo.
pause
goto MENU
