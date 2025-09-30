@echo off
echo ========================================
echo   Testing Docker Build Process
echo ========================================

echo.
echo Step 1: Testing frontend build...
docker build -f Dockerfile.frontend -t betting-platform-frontend .
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
echo ✅ Frontend build successful

echo.
echo Step 2: Testing backend build...
docker build -f Dockerfile.backend -t betting-platform-backend .
if %errorlevel% neq 0 (
    echo ❌ Backend build failed
    pause
    exit /b 1
)
echo ✅ Backend build successful

echo.
echo Step 3: Testing docker-compose configuration...
docker-compose -f docker-compose.prod.yml config
if %errorlevel% neq 0 (
    echo ❌ Docker Compose configuration is invalid
    pause
    exit /b 1
)
echo ✅ Docker Compose configuration is valid

echo.
echo ========================================
echo   All Docker builds successful!
echo ========================================
echo.
echo You can now run: docker-run.bat
echo.
pause
