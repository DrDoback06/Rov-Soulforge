@echo off
REM ##########################################################################
REM Realm of Valor - Windows Launch Script
REM ##########################################################################

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  pnpm is not installed. Installing...
    call npm install -g pnpm
)

REM Run the launcher
node launcher.js
