@echo off
echo ========================================
echo   Stopping Betting Platform Services
echo ========================================

echo.
echo Stopping all services...
docker-compose -f docker-compose.prod.yml down

echo.
echo Checking if services are stopped...
docker-compose -f docker-compose.prod.yml ps

echo.
echo ========================================
echo   Services Stopped Successfully
echo ========================================
echo.
echo To start again, run: docker-run.bat
echo To remove all data, run: docker-clean.bat
echo.
pause
