# 🚀 Betting Platform Dashboard - Complete Setup Guide

## **📋 Prerequisites**
- Node.js 18+ 
- Docker & Docker Compose
- Git

## **🔧 Quick Start**

### **1. Install Dependencies**
```bash
# Frontend dependencies
npm install

# Backend dependencies
npm run server:install
```

### **2. Start Database**
```bash
# Start PostgreSQL with Docker
npm run db:start

# Wait for database to be ready (30 seconds)
# Check logs: npm run db:logs
```

### **3. Start Full Application**
```bash
# Start both frontend and backend
npm run dev:full
```

### **4. Access Application**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Database**: localhost:5432

## **🔐 Demo Login Credentials**

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Super Admin** | admin@bettingplatform.com | admin123 | Full platform access |
| **Broker** | broker1@premiumbets.com | broker123 | Broker management |
| **User** | john.smith@email.com | user123 | User dashboard |

## **📊 Features Implemented**

### **✅ Authentication System**
- JWT-based authentication
- Role-based access control
- Secure password hashing
- Session management

### **✅ Real-time Dashboard**
- Live data from PostgreSQL
- Auto-refresh every 30 seconds
- Real-time notifications
- Performance optimized

### **✅ User Management**
- CRUD operations for users
- Role assignment
- Status management
- Search and filtering

### **✅ Broker Management**
- Broker performance tracking
- Revenue analytics
- User allocation
- Commission tracking

### **✅ Transaction System**
- Real-time transaction monitoring
- Status tracking
- Financial reporting
- Audit logging

### **✅ Analytics & KPIs**
- Revenue tracking
- Performance metrics
- Growth analytics
- Interactive charts

## **🛠 Development Commands**

```bash
# Database Management
npm run db:start          # Start database
npm run db:stop           # Stop database
npm run db:restart        # Restart database
npm run db:shell         # Connect to database
npm run db:backup        # Backup database
npm run db:reset         # Reset database

# Application Development
npm run dev              # Frontend only
npm run server:dev      # Backend only
npm run dev:full        # Both frontend & backend

# Production
npm run build           # Build frontend
npm run server:start    # Start backend
npm run start:full     # Production mode
```

## **🗄 Database Schema**

The application uses a comprehensive PostgreSQL schema with:

- **Users**: Authentication and user management
- **Brokers**: Broker information and performance
- **Transactions**: Financial transaction tracking
- **Bets**: Betting activity and results
- **Audit Logs**: Complete activity tracking
- **Views**: Optimized dashboard queries

## **🔒 Security Features**

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin security
- **Input Validation**: Request sanitization
- **SQL Injection Protection**: Parameterized queries

## **📈 Performance Optimizations**

- **Database Indexes**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Smart data caching strategies
- **Compression**: Response compression
- **Real-time Updates**: WebSocket/SSE integration

## **🐛 Troubleshooting**

### **Database Connection Issues**
```bash
# Check database status
npm run db:logs

# Reset database
npm run db:reset
```

### **API Connection Issues**
```bash
# Check backend logs
cd server && npm run dev

# Test API endpoint
curl http://localhost:3001/health
```

### **Frontend Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## **🚀 Production Deployment**

### **Environment Variables**
Create `.env` files:
- `env.local` - Frontend environment
- `server/.env` - Backend environment

### **Database Setup**
```bash
# Production database
npm run db:backup  # Backup current data
# Deploy to production database
```

### **Build & Deploy**
```bash
npm run build
npm run start:full
```

## **📚 API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### **Dashboard Endpoints**
- `GET /api/dashboard` - Dashboard data
- `GET /api/dashboard/kpis` - KPI metrics
- `GET /api/dashboard/charts` - Chart data

### **User Management**
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## **🎯 Next Steps**

1. **Customize Dashboard**: Modify components for your needs
2. **Add Features**: Implement additional functionality
3. **Deploy**: Set up production environment
4. **Monitor**: Add logging and monitoring
5. **Scale**: Optimize for high traffic

## **💡 Tips**

- Use `npm run db:shell` to inspect database
- Check browser console for frontend errors
- Monitor server logs for backend issues
- Use Postman to test API endpoints
- Backup database regularly with `npm run db:backup`

---

**🎉 Your dynamic betting platform dashboard is ready!**



