# Phase 1 Testing Checklist

## Quick Smoke Tests (Do Now)

### 1. Executive Portal (Port 5173)
- [*] Install dependencies: `cd admin-portal-executive && npm install`
- [*] Start dev server: `npm run dev`
- [*] Opens on http://localhost:5173
- [*] Login page displays correctly
- [*] UI components render (no console errors)

### 2. Management Portal (Port 5174)
- [*] Install dependencies: `cd admin-portal-management && npm install`
- [*] Start dev server: `npm run dev`
- [*] Opens on http://localhost:5174
- [*] Login page displays correctly
- [*] UI components render (no console errors)

### 3. User Portal (Port 3002)
- [*] Already has dependencies
- [*] Start dev server: `cd nadir-user && npm run dev`
- [*] Opens on http://localhost:3002
- [*] Casino/Sports pages load
- [*] No TypeScript compilation errors

### 4. Backend Server (Port 3001)
- [ ] Database is running: `docker-compose up -d postgres`
- [ ] Start server: `cd server && npm start`
- [ ] Health check: `curl http://localhost:3001/health`
- [ ] Returns `{"status":"OK"}`

### 5. CORS Testing (Optional)
- [ ] Executive portal can call API
- [ ] Management portal can call API
- [ ] User portal can call API
- [ ] No CORS errors in browser console

## What to Skip for Now

- ❌ Full login/authentication flow (will change in Phase 3)
- ❌ Role-based access control (will be enhanced in Phase 3)
- ❌ Database operations (will migrate to SQLite in Phase 2)
- ❌ Points system (Phase 4)
- ❌ Casino/Sports APIs (Phase 5-6)

## When to Do Full Testing

**After Phase 4 (Points Hierarchy System)**

At that point, test:
- ✅ Complete user lifecycle (Owner → Super Admin → Admin → Broker → User)
- ✅ Points allocation flow
- ✅ Role-based portal access
- ✅ SQLite database operations
- ✅ Commission calculations
- ✅ All 3 portals in Docker

## Quick Start Commands

```bash
# Terminal 1: Start Database
docker-compose up -d postgres

# Terminal 2: Start Backend
cd server && npm start

# Terminal 3: Start Executive Portal
cd admin-portal-executive && npm run dev

# Terminal 4: Start Management Portal  
cd admin-portal-management && npm run dev

# Terminal 5: Start User Portal
cd nadir-user && npm run dev
```

All portals should run without errors. That's enough for Phase 1! ✅
