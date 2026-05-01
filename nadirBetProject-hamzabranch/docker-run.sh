#!/bin/bash

echo "========================================"
echo "  Betting Platform - Docker Deployment"
echo "========================================"

echo ""
echo "Step 1: Checking if Docker is running..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker and Docker Compose"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo "Please start Docker Desktop or Docker daemon"
    exit 1
fi

echo "✅ Docker is available"

echo ""
echo "Step 2: Creating production environment file..."
if [ ! -f .env ]; then
    cp env.production .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your production values"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "Step 3: Building Docker images..."
echo "Building frontend image..."
if ! docker build -f Dockerfile.frontend -t betting-platform-frontend .; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "Building backend image..."
if ! docker build -f Dockerfile.backend -t betting-platform-backend .; then
    echo "❌ Backend build failed"
    exit 1
fi

echo "✅ Images built successfully"

echo ""
echo "Step 4: Starting services with Docker Compose..."
if ! docker-compose -f docker-compose.prod.yml up -d; then
    echo "❌ Failed to start services"
    exit 1
fi

echo ""
echo "Step 5: Waiting for services to be ready..."
sleep 30

echo ""
echo "Step 6: Checking service health..."
echo "Checking database..."
if ! docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U admin -d betting_platform; then
    echo "❌ Database is not ready"
else
    echo "✅ Database is ready"
fi

echo "Checking backend API..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Backend API is not responding"
else
    echo "✅ Backend API is ready"
fi

echo "Checking frontend..."
if ! curl -s http://localhost/ > /dev/null; then
    echo "❌ Frontend is not responding"
else
    echo "✅ Frontend is ready"
fi

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:3001/api"
echo "🗄️  Database: localhost:5432"
echo "📊 pgAdmin: http://localhost:8080 (optional)"
echo ""
echo "Login credentials:"
echo "- Super Admin: admin@bettingplatform.com / admin123"
echo "- Broker: broker1@premiumbets.com / broker123"
echo "- User: john.smith@email.com / user123"
echo ""
echo "To stop the services:"
echo "docker-compose -f docker-compose.prod.yml down"
echo ""
echo "To view logs:"
echo "docker-compose -f docker-compose.prod.yml logs -f"
echo ""
