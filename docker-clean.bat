@echo off
echo ========================================
echo   Cleaning Betting Platform Data
echo ========================================

echo.
echo ⚠️  WARNING: This will remove ALL data including the database!
echo Are you sure you want to continue? (y/N)
set /p confirm=

if /i not "%confirm%"=="y" (
    echo Operation cancelled
    pause
    exit /b 0
)

echo.
echo Stopping and removing services...
docker-compose -f docker-compose.prod.yml down -v

echo.
echo Removing Docker images...
docker rmi betting-platform-frontend betting-platform-backend 2>nul

echo.
echo Removing unused Docker resources...
docker system prune -f

echo.
echo ========================================
echo   Cleanup Complete
echo ========================================
echo.
echo All data and containers have been removed.
echo Run docker-run.bat to start fresh.
echo.
pause
