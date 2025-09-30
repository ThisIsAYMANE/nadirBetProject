# 🐳 Docker Deployment Guide - Betting Platform

This guide will help you deploy the Betting Platform as Docker containers for production use.

## 📋 Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** (included with Docker Desktop)
- **Git** (to clone the repository)

## 🚀 Quick Start

### 1. Clone and Navigate
```bash
git clone <your-repository-url>
cd betting-platform
```

### 2. Run with One Command
```bash
# Windows
docker-run.bat

# Linux/Mac
chmod +x docker-run.sh
./docker-run.sh
```

### 3. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5432
- **pgAdmin**: http://localhost:8080 (optional)

## 🔧 Manual Setup

### Step 1: Environment Configuration

1. **Copy environment template**:
   ```bash
   cp env.production .env
   ```

2. **Edit `.env` file** with your production values:
   ```env
   # Database Configuration
   DB_NAME=betting_platform
   DB_USER=admin
   DB_PASSWORD=your_secure_password_here
   
   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
   
   # Other configurations...
   ```

### Step 2: Build Docker Images

```bash
# Build frontend
docker build -f Dockerfile.frontend -t betting-platform-frontend .

# Build backend
docker build -f Dockerfile.backend -t betting-platform-backend .
```

### Step 3: Start Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🏗️ Architecture

The Docker setup includes:

### Services
- **Frontend**: Nginx serving React app
- **Backend**: Node.js API server
- **Database**: PostgreSQL 15
- **pgAdmin**: Database management (optional)

### Network
- All services communicate through `betting_network`
- Frontend proxies API requests to backend
- Backend connects to PostgreSQL

## 📁 File Structure

```
├── Dockerfile.frontend          # Frontend container
├── Dockerfile.backend           # Backend container
├── docker-compose.prod.yml      # Production compose file
├── nginx.conf                   # Nginx configuration
├── .dockerignore               # Docker ignore file
├── env.production              # Environment template
├── docker-run.bat              # Windows deployment script
├── docker-stop.bat             # Windows stop script
├── docker-clean.bat            # Windows cleanup script
└── DOCKER-DEPLOYMENT.md        # This guide
```

## 🔒 Security Features

### Production Security
- **Non-root containers**: Backend runs as non-root user
- **Security headers**: Nginx adds security headers
- **Rate limiting**: API rate limiting configured
- **Input validation**: Express validation middleware
- **JWT authentication**: Secure token-based auth
- **Password hashing**: bcrypt with configurable rounds

### Environment Variables
- All sensitive data in environment variables
- Separate production configuration
- No hardcoded secrets in images

## 📊 Monitoring & Health Checks

### Health Checks
- **Database**: PostgreSQL readiness check
- **Backend**: HTTP health endpoint
- **Frontend**: Nginx status check

### Logging
- **Structured logging**: JSON format logs
- **Log aggregation**: Docker logs collection
- **Error tracking**: Comprehensive error handling

## 🛠️ Management Commands

### Start Services
```bash
# Windows
docker-run.bat

# Linux/Mac
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services
```bash
# Windows
docker-stop.bat

# Linux/Mac
docker-compose -f docker-compose.prod.yml down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Access Database
```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U admin -d betting_platform

# Access pgAdmin
# Open http://localhost:8080
# Email: admin@bettingplatform.com
# Password: admin123
```

### Clean Everything
```bash
# Windows
docker-clean.bat

# Linux/Mac
docker-compose -f docker-compose.prod.yml down -v
docker rmi betting-platform-frontend betting-platform-backend
docker system prune -f
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_NAME` | Database name | `betting_platform` |
| `DB_USER` | Database user | `admin` |
| `DB_PASSWORD` | Database password | `admin123` |
| `JWT_SECRET` | JWT signing secret | Required |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Backend port | `3001` |
| `FRONTEND_URL` | Frontend URL | `http://localhost` |

### Nginx Configuration
- **Gzip compression**: Enabled
- **Static file caching**: 1 year
- **API rate limiting**: 10 requests/second
- **Security headers**: XSS, CSRF protection

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :80
   netstat -tulpn | grep :3001
   ```

2. **Database connection issues**:
   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Test connection
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U admin
   ```

3. **Backend not starting**:
   ```bash
   # Check backend logs
   docker-compose -f docker-compose.prod.yml logs backend
   
   # Check environment variables
   docker-compose -f docker-compose.prod.yml exec backend env
   ```

4. **Frontend not loading**:
   ```bash
   # Check nginx logs
   docker-compose -f docker-compose.prod.yml logs frontend
   
   # Check if backend is accessible
   curl http://localhost:3001/health
   ```

### Debug Mode
```bash
# Run in debug mode
docker-compose -f docker-compose.prod.yml up --build

# Access container shell
docker-compose -f docker-compose.prod.yml exec backend sh
docker-compose -f docker-compose.prod.yml exec frontend sh
```

## 📈 Performance Optimization

### Resource Limits
Add to `docker-compose.prod.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'
```

### Database Optimization
- **Connection pooling**: Configured in backend
- **Indexes**: Pre-created in database schema
- **Query optimization**: Views for dashboard queries

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Backups
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U admin betting_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U admin betting_platform < backup_file.sql
```

## 🌐 Production Deployment

### Domain Configuration
1. **Update DNS**: Point domain to server IP
2. **SSL Certificate**: Add SSL certificate to nginx
3. **Environment**: Update `FRONTEND_URL` and `CORS_ORIGIN`

### Load Balancer
For high availability, use a load balancer:
- **Nginx**: Multiple backend instances
- **HAProxy**: Advanced load balancing
- **Cloud Load Balancer**: AWS ALB, GCP LB

### Monitoring
- **Health checks**: Built-in health endpoints
- **Logging**: Centralized log collection
- **Metrics**: Application performance monitoring
- **Alerts**: Automated alerting system

## 📞 Support

### Demo Credentials
- **Super Admin**: admin@bettingplatform.com / admin123
- **Broker**: broker1@premiumbets.com / broker123
- **User**: john.smith@email.com / user123

### Useful Commands
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View resource usage
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

**🎉 Your Betting Platform is now running in Docker!**

For more information, check the main [SETUP.md](SETUP.md) file.
