@echo off
echo ========================================
echo   Betting Platform - Docker Deployment
echo ========================================

echo.
echo Step 1: Checking if Docker is running...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and start it
    pause
    exit /b 1
)
echo ✅ Docker is available

echo.
echo Step 2: Creating production environment file...
if not exist .env (
    copy env.production .env
    echo ✅ Created .env file from template
    echo ⚠️  Please edit .env file with your production values
) else (
    echo ✅ .env file already exists
)

echo.
echo Step 3: Building Docker images...
echo Building frontend image...
docker build -f Dockerfile.frontend -t betting-platform-frontend .
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

echo Building backend image...
docker build -f Dockerfile.backend -t betting-platform-backend .
if %errorlevel% neq 0 (
    echo ❌ Backend build failed
    pause
    exit /b 1
)

echo ✅ Images built successfully

echo.
echo Step 4: Starting services with Docker Compose...
docker-compose -f docker-compose.prod.yml up -d

echo.
echo Step 5: Waiting for services to be ready...
timeout /t 30 /nobreak > nul

echo.
echo Step 6: Checking service health...
echo Checking database...
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U admin -d betting_platform
if %errorlevel% neq 0 (
    echo ❌ Database is not ready
) else (
    echo ✅ Database is ready
)

echo Checking backend API...
curl -s http://localhost:3001/health > nul
if %errorlevel% neq 0 (
    echo ❌ Backend API is not responding
) else (
    echo ✅ Backend API is ready
)

echo Checking frontend...
curl -s http://localhost/ > nul
if %errorlevel% neq 0 (
    echo ❌ Frontend is not responding
) else (
    echo ✅ Frontend is ready
)

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost
echo 🔧 Backend API: http://localhost:3001/api
echo 🗄️  Database: localhost:5432
echo 📊 pgAdmin: http://localhost:8080 (optional)
echo.
echo Login credentials:
echo - Super Admin: admin@bettingplatform.com / admin123
echo - Broker: broker1@premiumbets.com / broker123
echo - User: john.smith@email.com / user123
echo.
echo To stop the services:
echo docker-compose -f docker-compose.prod.yml down
echo.
echo To view logs:
echo docker-compose -f docker-compose.prod.yml logs -f
echo.
pause
