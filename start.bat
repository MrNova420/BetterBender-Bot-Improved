@echo off
echo BetterBender 2.0 - Starting...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Check if CONFIG.json exists
if not exist "CONFIG.json" (
    echo CONFIG.json not found!
    echo Creating from example...
    copy CONFIG.example.json CONFIG.json
    echo CONFIG.json created!
    echo.
    echo Please edit CONFIG.json and set your server address
    pause
    exit /b 0
)

echo Starting BetterBender...
echo Dashboard: http://localhost:5000
echo No login required for localhost!
echo.
echo Press Ctrl+C to stop
echo ================================================
echo.

node dashboard/server.js CONFIG.json
pause
