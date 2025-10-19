@echo off
echo Starting Realm of Valor Mobile App...
echo.
echo Clearing cache and starting Metro server...
echo.

cd /d "%~dp0"
pnpm start --clear

echo.
echo Once Metro starts, press 'w' to launch web version
echo.
pause





