#!/bin/bash

echo "========================================"
echo "  Testing Docker Build Process"
echo "========================================"

echo ""
echo "Step 1: Testing frontend build..."
if ! docker build -f Dockerfile.frontend -t betting-platform-frontend .; then
    echo "❌ Frontend build failed"
    exit 1
fi
echo "✅ Frontend build successful"

echo ""
echo "Step 2: Testing backend build..."
if ! docker build -f Dockerfile.backend -t betting-platform-backend .; then
    echo "❌ Backend build failed"
    exit 1
fi
echo "✅ Backend build successful"

echo ""
echo "Step 3: Testing docker-compose configuration..."
if ! docker-compose -f docker-compose.prod.yml config; then
    echo "❌ Docker Compose configuration is invalid"
    exit 1
fi
echo "✅ Docker Compose configuration is valid"

echo ""
echo "========================================"
echo "  All Docker builds successful!"
echo "========================================"
echo ""
echo "You can now run: ./docker-run.sh"
echo ""
