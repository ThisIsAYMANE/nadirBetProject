# Manual Testing Guide - Phase 2

## Quick Start Testing (5 minutes)

### Step 1: Start Backend Server

Open PowerShell Terminal 1:
```powershell
cd "C:\Users\AYMANE MAALI\OneDrive\Bureau\nadir\server"
npm start
```

**Expected Output:**
```
Initializing database schema...
Database schema initialized successfully
✅ SQLite database initialized successfully
🚀 Server running on port 3001
📊 Dashboard API: http://localhost:3001/api
🏥 Health check: http://localhost:3001/health
```

✅ **If you see this, backend is ready!**

---

### Step 2: Start Executive Portal (Owner/Super Admin)

Open PowerShell Terminal 2:
```powershell
cd "C:\Users\AYMANE MAALI\OneDrive\Bureau\nadir\admin-portal-executive"
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ **Portal ready at: http://localhost:5173**

---

### Step 3: Start Management Portal (Admin/Broker)

Open PowerShell Terminal 3:
```powershell
cd "C:\Users\AYMANE MAALI\OneDrive\Bureau\nadir\admin-portal-management"
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

✅ **Portal ready at: http://localhost:5174**

---

### Step 4: Start User Portal

Open PowerShell Terminal 4:
```powershell
cd "C:\Users\AYMANE MAALI\OneDrive\Bureau\nadir\nadir-user"
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

✅ **Portal ready at: http://localhost:3000** (or 3002 if configured)

---

## Step 5: Test Each Portal

### 🔵 Test 1: Executive Portal (Owner Account)

1. **Open Browser:** http://localhost:5173
2. **Login with:**
   - Email: `owner@example.com`
   - Password: `password123`

**✅ Success if:**
- You see a login form
- After login, you're redirected to dashboard
- You see "Owner" or "Executive" in the interface
- No console errors (press F12 to check)

**Expected Features:**
- Full admin dashboard
- User management
- Broker management
- System settings
- All features visible

---

### 🟢 Test 2: Management Portal (Broker Account)

1. **Open Browser:** http://localhost:5174
2. **Login with:**
   - Email: `broker@example.com`
   - Password: `password123`

**✅ Success if:**
- You see a login form
- After login, you're redirected to broker dashboard
- You see broker-specific features
- No console errors

**Expected Features:**
- Broker dashboard
- User management (broker's users only)
- Transaction history
- Cashout requests
- Limited admin features

---

### 🟡 Test 3: User Portal (Regular User)

1. **Open Browser:** http://localhost:3000 (or 3002)
2. **Login with:**
   - Email: `user@example.com`
   - Password: `password123`

**✅ Success if:**
- You see a login form
- After login, you see user dashboard
- Casino and sports sections visible
- Your balance shows (1000 points)
- No console errors

**Expected Features:**
- User dashboard
- Casino games
- Sports betting
- Balance display
- Transaction history

---

## Quick Test Checklist

Use this checklist as you test:

### Backend
- [*] Server started without errors
- [ ] Health endpoint responds: http://localhost:3001/health

### Executive Portal (http://localhost:5173)
- [ ] Portal loads
- [ ] Login form appears
- [ ] Can login with owner@example.com
- [ ] Dashboard displays after login
- [ ] No console errors

### Management Portal (http://localhost:5174)
- [ ] Portal loads
- [ ] Login form appears
- [ ] Can login with broker@example.com
- [ ] Dashboard displays after login
- [ ] No console errors

### User Portal (http://localhost:3000)
- [ ] Portal loads
- [ ] Login form appears
- [ ] Can login with user@example.com
- [ ] Dashboard displays after login
- [ ] Balance shows 1000 points
- [ ] No console errors

---

## Test All Accounts

Try logging in with each account to verify role-based access:

| Portal | URL | Test Account | Expected Role |
|--------|-----|--------------|---------------|
| Executive | http://localhost:5173 | owner@example.com | Owner (full access) |
| Executive | http://localhost:5173 | superadmin@example.com | Super Admin (full access) |
| Management | http://localhost:5174 | admin@example.com | Admin (limited access) |
| Management | http://localhost:5174 | broker@example.com | Broker (broker features) |
| User | http://localhost:3000 | user@example.com | Regular User (user features) |

**All passwords:** `password123`

---

## Common Issues & Solutions

### Issue: "Cannot connect to server"
**Solution:**
1. Check backend is running (Terminal 1)
2. Verify URL is http://localhost:3001
3. Check no firewall blocking

### Issue: "Login fails with 401"
**Solution:**
1. Make sure database was seeded: `node server/seed-database.js`
2. Check email/password exactly: `owner@example.com` / `password123`
3. Check backend logs for errors

### Issue: "Portal doesn't load"
**Solution:**
1. Check npm run dev is running
2. Try accessing URL directly in browser
3. Check for port conflicts
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: "White screen after login"
**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Verify API_URL is configured correctly
4. Check backend is responding

---

## What to Look For

### ✅ Good Signs:
- All servers start without errors
- Login redirects to dashboard
- No red errors in browser console
- Data loads correctly
- Navigation works
- Backend responds to API calls

### ❌ Warning Signs:
- 404 errors in console
- CORS errors
- Connection refused
- Blank pages
- Infinite loading
- 401/403 errors

---

## Quick Verification Commands

### Check Backend Health
```powershell
Invoke-WebRequest -Uri http://localhost:3001/health -UseBasicParsing | Select-Object -ExpandProperty Content
```
**Expected:** `{"status":"OK","timestamp":"..."}`

### Check Database
```powershell
cd server/data
ls
```
**Expected:** See `betting_platform.db` files

### Check Logged Users
```powershell
cd server
node -e "import('./src/database/db.js').then(({db}) => { db.query('SELECT username, email, user_type FROM users').then(r => { console.table(r.rows); db.close(); }); })"
```

---

## Success Criteria

**Phase 2 is verified if:**

✅ Backend starts and responds to health checks  
✅ All 3 portals start successfully  
✅ Can login to Executive Portal as owner  
✅ Can login to Management Portal as broker  
✅ Can login to User Portal as user  
✅ No critical console errors  
✅ Basic navigation works  

**When all above pass → Phase 2 Complete! ✅**

---

## Next Steps After Testing

Once manual testing passes:
1. ✅ Mark tests as complete in PHASE2_TESTING.md
2. 🚀 Ready to start Phase 3 (Role System & Access Control)
3. 📝 Document any issues found
