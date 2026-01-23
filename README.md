# 🎰 FREEBET - Multi-Portal Betting Platform

A comprehensive betting platform with role-based portals for Owner, Super Admin, Admin, Broker, and Regular Users.

## 📁 **PROJECT STRUCTURE**

```
nadir/
├── server/                    # Node.js + Express + SQLite Backend
│   ├── src/
│   │   ├── database/         # Database schema & connection
│   │   ├── middleware/       # Auth & validation
│   │   ├── routes/           # API endpoints
│   │   └── services/         # Business logic
│   └── package.json
│
├── admin-portal-executive/   # Owner & Super Admin Portal (Vite + React)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/
│   └── package.json
│
├── admin-portal-management/  # Admin & Broker Portal (Vite + React)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/
│   └── package.json
│
└── nadir-user/               # User Portal (Next.js 13+)
    ├── app/
    ├── components/
    └── package.json
```

---

## 🚀 **QUICK START**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **1. Backend Setup**
```bash
cd server
npm install
npm start
# Runs on http://localhost:3001
```

### **2. Owner/Super Admin Portal**
```bash
cd admin-portal-executive
npm install
npm run dev
# Runs on http://localhost:5173
```

### **3. Admin/Broker Portal**
```bash
cd admin-portal-management
npm install
npm run dev
# Runs on http://localhost:5174
```

### **4. User Portal**
```bash
cd nadir-user
npm install
npm run dev
# Runs on http://localhost:3002
```

---

## 🧪 **TESTING**

### **Phase 4 Testing (Current)**
```bash
# See PHASE4_TESTING.md for complete guide
```

**Test Accounts:**
| Role | Portal | Email | Password |
|------|--------|-------|----------|
| Owner | :5173 | owner@example.com | password123 |
| Super Admin | :5173 | superadmin@example.com | password123 |
| Admin | :5174 | admin@example.com | password123 |
| Broker | :5174 | broker@example.com | password123 |
| User | :3002 | user@example.com | password123 |

---

## ✅ **COMPLETED PHASES**

### **Phase 1: Initial Setup**
- ✅ Database schema (SQLite)
- ✅ Backend API
- ✅ Authentication system
- ✅ Frontend portals structure

### **Phase 2: SQLite Migration**
- ✅ Migrated from PostgreSQL to SQLite
- ✅ WAL mode for performance
- ✅ Optimized queries
- ✅ Database views for dashboards

### **Phase 3: Role-Based Access Control**
- ✅ 5-tier role hierarchy
- ✅ JWT authentication
- ✅ Protected routes
- ✅ Broker assignment to users
- ✅ User management UI

### **Phase 4: Points Hierarchy System**
- ✅ Points allocation flow
- ✅ Points request/approval workflow
- ✅ Dynamic user data (name, email, balances)
- ✅ Auto-refresh balances (30s)
- ✅ Points management UI (all portals)
- ✅ Placeholder UI for betting features

---

## 🎯 **CURRENT FEATURES**

### **For Owners/Super Admins:**
- Create points from nothing
- Allocate to any user
- View hierarchy and stats
- Approve point requests
- Monitor all allocations

### **For Admins/Brokers:**
- Allocate points to lower roles
- Approve user requests
- View assigned users
- Monitor allocations and balances

### **For Users:**
- View real-time points balance
- Request points from broker
- View transaction history
- Profile with dynamic data
- Cashout requests

---

## 📊 **TECHNOLOGY STACK**

### **Backend:**
- Node.js + Express.js
- SQLite (better-sqlite3)
- JWT Authentication
- bcrypt for passwords

### **Frontend:**
- **Executive Portal:** Vite + React + TypeScript
- **Management Portal:** Vite + React + TypeScript
- **User Portal:** Next.js 13+ + TypeScript
- Tailwind CSS
- Lucide Icons

### **Database:**
- SQLite with WAL mode
- Foreign key constraints
- Indexed queries
- Database views for analytics

---

## 📝 **API ENDPOINTS**

### **Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### **Users:**
- `GET /api/users` - List users (paginated)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### **Points:**
- `GET /api/points/balance` - Get user balance
- `POST /api/points/allocate` - Allocate points
- `POST /api/points/request` - Request points
- `POST /api/points/requests/:id/respond` - Approve/reject
- `GET /api/points/history` - Transaction history
- `GET /api/points/hierarchy` - View hierarchy

### **Brokers:**
- `GET /api/brokers` - List brokers
- `GET /api/brokers/:id/users` - Get broker's users

### **Dashboard:**
- `GET /api/dashboard/stats` - Dashboard KPIs
- `GET /api/charts/revenue` - Revenue charts
- `GET /api/kpis` - Key metrics

---

## 🔐 **SECURITY**

- JWT tokens for authentication
- bcrypt password hashing
- Role-based authorization
- Protected API routes
- Input validation
- SQL injection prevention (parameterized queries)

---

## 🗄️ **DATABASE SCHEMA**

### **Key Tables:**
- `users` - User accounts with roles
- `user_points` - Points balances
- `points_allocation` - Allocation records
- `points_ledger` - Transaction history
- `points_requests` - Request workflow
- `transactions` - Betting transactions
- `cashout_requests` - Cashout workflow

### **Views:**
- `user_dashboard_view` - User KPIs
- `broker_dashboard_view` - Broker stats
- `admin_dashboard_view` - Admin analytics

---

## 📖 **DOCUMENTATION**

- `PHASE4_TESTING.md` - Complete testing guide
- `PHASE4_IMPLEMENTATION.md` - Technical implementation
- `PHASE4_USER_PROFILE_INTEGRATION.md` - Profile features
- `PHASE3_COMPLETE.md` - RBAC implementation
- `DOCKER-DEPLOYMENT.md` - Docker deployment

---

## 🐛 **TROUBLESHOOTING**

### **Backend won't start:**
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001
# Kill the process if needed
taskkill /PID <PID> /F
```

### **Database errors:**
```bash
# Reset database (WARNING: Deletes all data)
cd server
rm data/*.db
npm start  # Will recreate with seed data
```

### **Frontend won't build:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 **NEXT PHASE (Phase 5)**

### **Planned Features:**
- Casino games integration
- Sports betting functionality
- Real bet placement
- Win/loss tracking
- Betting history (replace placeholders)
- Win rate calculation
- Recent activity feed
- Points usage for betting

---

## 📞 **SUPPORT**

For issues:
1. Check `PHASE4_TESTING.md` troubleshooting section
2. Verify all services are running
3. Check browser console for errors
4. Review API responses in Network tab

---

## 📄 **LICENSE**

Proprietary - All rights reserved

---

## 👥 **TEAM**

- Development: Nadir Team
- Testing: In Progress (Phase 4)
- Deployment: Pending

---

**Current Status:** ✅ Phase 4 Complete - Ready for Testing

**Next Milestone:** Casino & Sports Integration (Phase 5)
