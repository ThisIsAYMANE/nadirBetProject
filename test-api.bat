@echo off
echo Testing API endpoints...

echo.
echo Testing health endpoint...
curl -s http://localhost:3001/health

echo.
echo.
echo Testing auth endpoint...
curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@bettingplatform.com\",\"password\":\"admin123\"}"

echo.
echo.
echo API test completed!
pause




