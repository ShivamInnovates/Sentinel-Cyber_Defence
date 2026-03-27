@echo off
setlocal enabledelayedexpansion

:: ========================================================================================
:: SENTINEL Frontend - Vite Dev Server (Port 5173)
:: ========================================================================================

cd /d "%~dp0frontend"

:MENU
cls
echo.
echo =================================
echo  SENTINEL Frontend  ^|  Port 5173
echo =================================
echo.
echo   1) Start Frontend Dev Server
echo   2) Install / Reinstall node_modules
echo   3) Build for Production
echo.
echo   0) Exit
echo.
set /p choice="Choose an option: "

if "%choice%"=="1" goto :START
if "%choice%"=="2" goto :INSTALL
if "%choice%"=="3" goto :BUILD
if "%choice%"=="0" exit /b
echo Invalid choice.
pause
goto :MENU


:START
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not found. Download from https://nodejs.org/
    pause
    goto :MENU
)
if not exist "node_modules" (
    echo node_modules not found. Running npm install...
    npm install
    if errorlevel 1 (
        echo ERROR: npm install failed.
        pause
        goto :MENU
    )
)
echo.
echo  Starting Vite dev server...
echo  Frontend will be available at: http://localhost:5173
echo.
echo  Press Ctrl+C to stop.
echo.
npm run dev
echo.
pause
goto :MENU


:INSTALL
echo Running npm install...
npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
) else (
    echo Dependencies installed successfully.
)
pause
goto :MENU


:BUILD
echo Building for production...
npm run build
if errorlevel 1 (
    echo ERROR: Build failed.
) else (
    echo Build complete! Output in the dist/ folder.
)
pause
goto :MENU
