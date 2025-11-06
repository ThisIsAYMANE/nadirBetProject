@echo off
echo ========================================
echo   Betting Platform - Issue Diagnosis
echo ========================================

echo.
echo Step 1: Checking if database is running...
docker ps | findstr postgres
if %errorlevel% neq 0 (
    echo ❌ Database is NOT running
    echo Run: npm run db:start
) else (
    echo ✅ Database is running
)

echo.
echo Step 2: Checking if server is running...
curl -s http://localhost:3001/health > nul
if %errorlevel% neq 0 (
    echo ❌ Server is NOT running on port 3001
    echo Run: npm run server:dev
) else (
    echo ✅ Server is running on port 3001
)

echo.
echo Step 3: Testing API endpoints...
echo Testing /health endpoint:
curl -s http://localhost:3001/health

echo.
echo Testing /api/auth/login endpoint:
curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@bettingplatform.com\",\"password\":\"admin123\"}"

echo.
echo Step 4: Checking frontend environment...
echo VITE_API_URL should be: http://localhost:3001/api
echo Check if .env.local file exists in root directory

echo.
echo ========================================
echo   Diagnosis Complete
echo ========================================
pause








