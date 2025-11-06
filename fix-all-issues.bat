@echo off
echo ========================================
echo   COMPLETE FIX - Betting Platform
echo ========================================

echo.
echo Step 1: Stopping all processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im nodemon.exe 2>nul

echo.
echo Step 2: Starting database...
npm run db:start

echo.
echo Waiting for database to initialize...
timeout /t 20 /nobreak > nul

echo.
echo Step 3: Checking database connection...
npm run db:shell -c "SELECT COUNT(*) as user_count FROM users;"

echo.
echo Step 4: Installing server dependencies...
cd server
npm install
cd ..

echo.
echo Step 5: Copying environment file...
copy server\env server\.env

echo.
echo Step 6: Starting server...
start "Server" cmd /k "cd server && npm run dev"

echo.
echo Waiting for server to start...
timeout /t 15 /nobreak > nul

echo.
echo Step 7: Testing server endpoints...
echo Testing health endpoint:
curl -s http://localhost:3001/health

echo.
echo Testing login endpoint:
curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@bettingplatform.com\",\"password\":\"admin123\"}"

echo.
echo Step 8: Starting frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   FIX COMPLETE!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3001/api
echo.
echo Login credentials:
echo - admin@bettingplatform.com / admin123
echo - broker1@premiumbets.com / broker123
echo - john.smith@email.com / user123
echo.
echo If you still see errors, check the server terminal for database connection issues.
echo.
pause








