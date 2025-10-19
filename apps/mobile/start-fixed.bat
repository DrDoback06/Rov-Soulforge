@echo off
echo ========================================
echo Starting Realm of Valor Mobile App
echo ========================================
echo.

REM Navigate to the correct directory
cd /d "F:\Soulforge 09-2025\rov\apps\mobile"

echo Current directory: %CD%
echo.

REM Check if we're in the right place
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please make sure you're in the mobile app directory
    pause
    exit /b 1
)

echo ✅ Found package.json
echo.

REM Try to start the server
echo Starting Metro server...
echo.

REM Method 1: Try npx expo start
echo Trying: npx expo start --clear --web
npx expo start --clear --web

if %ERRORLEVEL% neq 0 (
    echo.
    echo npx expo start failed, trying alternative...
    echo.
    
    REM Method 2: Try pnpm start
    echo Trying: pnpm start --clear --web
    pnpm start --clear --web
    
    if %ERRORLEVEL% neq 0 (
        echo.
        echo pnpm start failed, trying workspace command...
        echo.
        
        REM Method 3: Try from workspace root
        cd /d "F:\Soulforge 09-2025\rov"
        echo Trying: pnpm --filter @rov/mobile start --clear --web
        pnpm --filter @rov/mobile start --clear --web
    )
)

echo.
echo ========================================
echo Once Metro starts, press 'w' to launch web
echo Press Ctrl+C to stop the server
echo ========================================
pause





