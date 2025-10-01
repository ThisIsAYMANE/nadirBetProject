@echo off
echo ========================================
echo   Betting Platform - Full System Setup
echo ========================================

echo.
echo Step 1: Installing frontend dependencies...
npm install

echo.
echo Step 2: Installing server dependencies...
cd server
npm install
cd ..

echo.
echo Step 3: Starting database...
npm run db:start

echo.
echo Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo.
echo Step 4: Testing database connection...
npm run db:shell -c "SELECT 'Database connected successfully' as status;"

echo.
echo Step 5: Starting full application...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3001/api
echo.
echo Press Ctrl+C to stop the application
echo.

npm run dev:full

pause




