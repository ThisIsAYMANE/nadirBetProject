# Nadir - Multi-Portal Betting Platform

A modern, scalable betting platform with separate portals for executives, managers, and end users. Built with React, Next.js, Node.js, and SQLite.

## 🏗️ Architecture

### Three Independent Portals

1. **Executive Portal** (Port 5173)
   - For: Platform Owner & Super Admins
   - Tech: React + Vite + TypeScript
   - Features: Full system management, super admin creation, platform-wide analytics

2. **Management Portal** (Port 5174)
   - For: Admins & Brokers
   - Tech: React + Vite + TypeScript
   - Features: Broker management, user management, shop operations

3. **User Portal** (Port 3002)
   - For: Regular Users (Bettors)
   - Tech: Next.js 13+ + TypeScript
   - Features: Sports betting, casino games, balance management

### Backend API (Port 3001)

- **Tech Stack**: Node.js + Express + SQLite
- **Database**: SQLite with WAL mode (file-based, portable)
- **Auth**: JWT tokens + bcrypt password hashing
- **API**: RESTful endpoints for all operations

---

## 🚀 Quick Start

### Prerequisites

```bash
- Node.js 18+ installed
- npm or yarn
- Git
```

### 1. Clone Repository

```bash
git clone <repository-url>
cd nadir
```

### 2. Start Backend

```bash
cd server
npm install
npm start
```

Backend runs on: http://localhost:3001

### 3. Start Executive Portal

```bash
cd admin-portal-executive
npm install
npm run dev
```

Portal runs on: http://localhost:5173

### 4. Start Management Portal

```bash
cd admin-portal-management
npm install
npm run dev
```

Portal runs on: http://localhost:5174

### 5. Start User Portal

```bash
cd nadir-user
npm install
npm run dev
```

Portal runs on: http://localhost:3002

---

## 🧪 Test Accounts

All passwords: `password123`

| Role | Email | Portal URL |
|------|-------|------------|
| Owner | owner@example.com | http://localhost:5173 |
| Super Admin | superadmin@example.com | http://localhost:5173 |
| Admin | admin@example.com | http://localhost:5174 |
| Broker | broker@example.com | http://localhost:5174 |
| Regular User | user@example.com | http://localhost:3002 |

---

## 📂 Project Structure

```
nadir/
├── admin-portal-executive/    # Owner/Super Admin portal (React+Vite)
├── admin-portal-management/   # Admin/Broker portal (React+Vite)
├── nadir-user/                # User portal (Next.js)
├── server/                    # Backend API (Node.js+Express+SQLite)
│   ├── src/
│   │   ├── database/          # SQLite schema and connection
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/            # API endpoints
│   │   └── services/          # Business logic
│   ├── data/                  # SQLite database files
│   ├── scripts/               # Utility scripts
│   ├── seed-database.js       # Database seeder
│   └── test-phase2.js         # Test suite
├── archive/                   # Archived PostgreSQL files
├── docs/                      # Detailed documentation
├── PHASE1_TESTING.md          # Phase 1 test checklist
├── PHASE2_TESTING.md          # Phase 2 test checklist
├── PHASE2_SUMMARY.md          # Phase 2 implementation summary
└── PHASE3_PLAN.md             # Phase 3 implementation plan
```

---

## 🗄️ Database

### SQLite Database

- **Location**: `server/data/betting_platform.db`
- **Mode**: WAL (Write-Ahead Logging) for better concurrency
- **Auto-Init**: Schema initializes automatically on first run

### Seeding Test Data

```bash
cd server
node seed-database.js
```

Creates 5 test users (one for each role) + broker profile + points balance.

### Database Schema

12 main tables:
- users, brokers, user_points
- transactions, bets, cashout_requests
- points_allocation, messages
- broker_reviews, alerts
- audit_logs, fraud_alerts

---

## 🔐 Authentication & Authorization

### JWT-Based Authentication

- Login returns JWT token
- Token expires in 24 hours
- Token required for all protected routes

### Role Hierarchy

```
Owner (Highest)
  ↓
Super Admin
  ↓
Admin
  ↓
Broker
  ↓
Regular User (Lowest)
```

### Role-Based Access Control

**Phase 3** will implement:
- Role validation middleware
- Route protection
- Hierarchy enforcement
- Permission checks

---

## 🎮 Features

### Current (Phase 1-2 Complete)

✅ Multi-portal architecture  
✅ SQLite database migration  
✅ User authentication  
✅ JWT token management  
✅ Basic CRUD operations  
✅ Test data seeding  

### In Progress (Phase 3)

🚧 Role-based access control  
🚧 User creation validation  
🚧 Hierarchy enforcement  
🚧 Permission middleware  

### Planned (Phase 4+)

⏳ Points allocation system  
⏳ Betting/casino integration  
⏳ Transaction management  
⏳ Cashout system  
⏳ Commission calculation  

---

## 🧪 Testing

### Automated Tests

```bash
cd server
node test-phase2.js
```

Runs 7 automated tests covering:
- Database creation
- Authentication
- CRUD operations
- API endpoints

### Manual Testing

See `MANUAL_TESTING_GUIDE.md` and `TESTING_NOW.md` in docs.

---

## 🐳 Docker Deployment

**Note**: Docker configuration available but currently optimized for local development.

```bash
docker-compose up -d
```

See `DOCKER-DEPLOYMENT.md` for production deployment.

---

## 📝 Development Workflow

### Adding New Features

1. Create feature branch
2. Implement in appropriate portal/backend
3. Test with existing test accounts
4. Update documentation
5. Create pull request

### Code Style

- TypeScript for all frontend code
- ES6+ for backend
- ESLint configured for all projects
- Follow existing patterns

---

## 🔧 Configuration

### Backend Environment Variables

Copy `server/env.example` to `server/env`:

```env
PORT=3001
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3002
```

### Portal Configuration

Each portal has `.env.example` file. Copy to `.env.local` and configure API URLs.

---

## 📚 Documentation

- `PHASE1_TESTING.md` - Multi-portal setup testing
- `PHASE2_TESTING.md` - SQLite migration testing
- `PHASE2_SUMMARY.md` - Phase 2 implementation details
- `PHASE3_PLAN.md` - Role system implementation plan
- `MANUAL_TESTING_GUIDE.md` - Manual testing procedures
- `DOCKER-DEPLOYMENT.md` - Docker deployment guide

---

## 🤝 Contributing

1. Follow existing code structure
2. Test thoroughly before committing
3. Update documentation for new features
4. Use meaningful commit messages

---

## 📜 License

[Your License Here]

---

## 🆘 Support & Issues

For issues or questions:
1. Check existing documentation
2. Review test files for examples
3. Check terminal logs for errors
4. Open an issue with detailed description

---

## 🎯 Project Status

**Current Phase**: Phase 2 Complete ✅  
**Next Phase**: Phase 3 (Role System & Access Control)  
**Overall Progress**: ~30% Complete

### Milestones

- [x] Phase 0: Code cleanup
- [x] Phase 1: Multi-portal architecture
- [x] Phase 2: SQLite migration
- [ ] Phase 3: Role system
- [ ] Phase 4: Points hierarchy
- [ ] Phase 5: Casino integration
- [ ] Phase 6: Sports betting
- [ ] Phase 7: Commission system
- [ ] Phase 8: Production deployment

---

**Built with ❤️ using React, Next.js, Node.js, and SQLite**
