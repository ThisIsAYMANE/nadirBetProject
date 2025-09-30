@echo off
echo ========================================
echo   Fixing and Starting Betting Platform
echo ========================================

echo.
echo Step 1: Stopping any running processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im nodemon.exe 2>nul

echo.
echo Step 2: Starting database...
npm run db:start

echo.
echo Waiting for database to initialize...
timeout /t 15 /nobreak > nul

echo.
echo Step 3: Testing database connection...
npm run db:shell -c "SELECT 'Database connected' as status;"

echo.
echo Step 4: Installing server dependencies...
cd server
npm install
cd ..

echo.
echo Step 5: Starting server...
start "Server" cmd /k "cd server && npm run dev"

echo.
echo Waiting for server to start...
timeout /t 10 /nobreak > nul

echo.
echo Step 6: Testing server...
curl -s http://localhost:3001/health

echo.
echo Step 7: Starting frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3001/api
echo.
echo Login with:
echo - admin@bettingplatform.com / admin123
echo - broker1@premiumbets.com / broker123
echo - john.smith@email.com / user123
echo.
pause

