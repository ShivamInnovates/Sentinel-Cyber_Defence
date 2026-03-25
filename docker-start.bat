@echo off
setlocal enabledelayedexpansion

:: ========================================================================================
:: TRINETRA Docker Quick Start Script (Windows Batch)
:: ========================================================================================

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
echo   4) View logs
echo   5) Rebuild images
echo   6) Clean up containers and volumes
echo   7) Check service status
echo   0) Exit
echo.
set /p choice="Choose an option (0-7): "

if "%choice%"=="1" goto START_DEV
if "%choice%"=="2" goto START_PROD
if "%choice%"=="3" goto STOP
if "%choice%"=="4" goto LOGS
if "%choice%"=="5" goto BUILD
if "%choice%"=="6" goto CLEAN
if "%choice%"=="7" goto STATUS
if "%choice%"=="0" exit /b
goto MENU

:START_DEV
echo Starting TRINETRA services in development mode...
docker compose --env-file .env up -d
echo Services started!
echo Frontend: http://localhost:80
echo Backend API: http://localhost:8000
pause
goto MENU

:START_PROD
if not exist .env.prod (
    echo .env.prod file not found. Please create it from .env.prod template.
    pause
    goto MENU
)
echo Starting TRINETRA services in production mode...
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
echo Production services started!
pause
goto MENU

:STOP
echo Stopping TRINETRA services...
docker compose down
echo Services stopped!
pause
goto MENU

:LOGS
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
echo Images rebuilt!
pause
goto MENU

:CLEAN
echo WARNING: This will remove all containers and volumes. Are you sure? (y/n)
set /p confirm="Confirm: "
if /i "%confirm%"=="y" (
    docker compose down -v
    docker system prune -f
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
