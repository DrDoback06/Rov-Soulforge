@echo off
echo ========================================
echo Starting Realm of Valor
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Backend Server...
start "ROV Backend" cmd /k "cd apps\backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Mobile App...
start "ROV Mobile" cmd /k "cd apps\mobile && npx expo start --clear"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend: Check the "ROV Backend" window
echo Mobile: Check the "ROV Mobile" window
echo.
echo Press 'w' in the Mobile window to open in browser
echo.
pause







