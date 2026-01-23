# 🧪 PHASE 4 - COMPLETE TESTING GUIDE

## 📋 **WHAT TO TEST**

Phase 4 implements:
1. ✅ **Points Hierarchy System** (Owner → Super Admin → Admin → Broker → User)
2. ✅ **Dynamic User Data** (Real names, emails, balances)
3. ✅ **Points Allocation** (Flow down the hierarchy)
4. ✅ **Points Requests** (Users request, Brokers approve)
5. ✅ **Auto-Refresh** (Balances update every 30 seconds)
6. ✅ **Placeholder UI** (Betting sections marked "Coming Soon")

---

## 🚀 **PRE-TESTING SETUP** (2 minutes)

### **Step 1: Verify Backend is Running**

```bash
# Check if backend is running
curl http://localhost:3001/health

# Expected response:
{"status":"OK","timestamp":"..."}

# If not running:
cd server
npm start
```

### **Step 2: Verify Frontend Portals**

Open 3 browser windows:
- **Owner/Super Admin Portal:** http://localhost:5173
- **Admin/Broker Portal:** http://localhost:5174
- **User Portal:** http://localhost:3002

All should load without errors.

### **Step 3: Test Accounts**

| Role | Portal | Email | Password |
|------|--------|-------|----------|
| Owner | 5173 | owner@example.com | password123 |
| Super Admin | 5173 | superadmin@example.com | password123 |
| Admin | 5174 | admin@example.com | password123 |
| Broker | 5174 | broker@example.com | password123 |
| Regular User | 3002 | user@example.com | password123 |

---

## ✅ **TEST SUITE (20 Minutes)**

---

## **TEST 1: OWNER - CREATE & ALLOCATE POINTS** (4 min)

### **1.1 Login as Owner**
```
✓ URL: http://localhost:5173
✓ Email: owner@example.com
✓ Password: password123
✓ Should redirect to dashboard
```

**VERIFY:**
- [*] Header shows "owner@example.com" or owner name (DYNAMIC)
- [*] Left sidebar visible
- [*] Dashboard loads with stats

### **1.2 Navigate to Points Management**
```
✓ Click "Points Management" in left sidebar (🪙 icon)
```

**VERIFY:**
- [ ] Page loads with 4 stat cards at top
- [ ] Points Hierarchy table visible
- [ ] Recent Allocations section visible
- [ ] Stats show zeros (if first time)

### **1.3 Check Initial Balance**
```
Look at the 4 stat cards:
```

**VERIFY:**
- [ ] Total Balance: 0 (or previous amount)
- [ ] Available: 0
- [ ] Allocated: 0
- [ ] Pending Requests: 0

### **1.4 Allocate 100,000 to Super Admin**
```
1. Scroll to "Points Hierarchy" table
2. Find row with role "SUPER_ADMIN"
3. Click green "Allocate" button
4. Modal opens
5. Enter Amount: 100000
6. Enter Notes: Initial allocation for testing Phase 4
7. Click "Allocate Points" button
```

**VERIFY:**
- [ ] Modal closes automatically
- [ ] Success message appears
- [ ] Stats update:
  - Total Balance: 100,000
  - Allocated: 100,000
  - Available: 0
- [ ] Hierarchy table shows Super Admin Balance: 100,000
- [ ] Recent Allocations shows new entry

**KEY POINT:** Owner can create points from NOTHING! This is the special power.

### **1.5 Allocate 50,000 to Admin**
```
1. In hierarchy table, find "ADMIN" role
2. Click "Allocate"
3. Amount: 50000
4. Notes: Admin initial allocation
5. Click "Allocate Points"
```

**VERIFY:**
- [ ] Owner Total Balance: 150,000 (100k + 50k created)
- [ ] Owner Allocated: 150,000
- [ ] Admin Balance: 50,000 in hierarchy table

### **1.6 Allocate 75,000 to Broker**
```
1. Find "BROKER" role in hierarchy
2. Click "Allocate"
3. Amount: 75000
4. Notes: Broker initial allocation
5. Click "Allocate Points"
```

**VERIFY:**
- [ ] Owner Total Balance: 225,000 (created 225k total)
- [ ] Owner Allocated: 225,000
- [ ] Broker Balance: 75,000

---

## **TEST 2: BROKER - ALLOCATE TO USER** (4 min)

### **2.1 Login as Broker**
```
✓ Open NEW incognito window: http://localhost:5174
✓ Email: broker@example.com
✓ Password: password123
```

**VERIFY:**
- [ ] Login successful
- [ ] Header shows broker email/name (DYNAMIC)
- [ ] Dashboard loads

### **2.2 Check Points Balance Widget**
```
On main dashboard:
```

**VERIFY:**
- [ ] Compact points balance widget visible
- [ ] Shows Available: 75,000
- [ ] Shows Allocated: 0

### **2.3 Navigate to Points Management**
```
✓ Click "Points Management" in sidebar
```

**VERIFY:**
- [ ] Stats show:
  - Balance: 75,000
  - Available: 75,000
  - Allocated: 0
  - Pending: 0

### **2.4 Allocate 5,000 to Regular User**
```
1. In hierarchy table, find "REGULAR_USER" role
2. Click "Allocate" button
3. Amount: 5000
4. Notes: Initial points for user testing
5. Click "Allocate Points"
```

**VERIFY:**
- [ ] Modal closes
- [ ] Broker stats update:
  - Balance: 75,000 (unchanged)
  - Allocated: 5,000
  - Available: 70,000 (75k - 5k)
- [ ] Recent allocations shows entry

### **2.5 Test Hierarchy Restriction**
```
Try to find Admin or Owner in hierarchy table
```

**VERIFY:**
- [ ] Admin and Owner NOT in broker's hierarchy table
- [ ] Broker can only see Super Admin (above) and Users (below)
- [ ] Cannot allocate upward (this is correct behavior)

---

## **TEST 3: USER - DYNAMIC DATA** (5 min)

### **3.1 Login as Regular User**
```
✓ URL: http://localhost:3002
✓ Email: user@example.com
✓ Password: password123
```

**VERIFY:**
- [ ] Login successful
- [ ] Redirects to home page

### **3.2 Check Header Balances (DYNAMIC)**
```
Look at top-right of page:
```

**VERIFY:**
- [ ] 🪙 Coins icon visible
- [ ] Shows: 5,000 (from broker allocation)
- [ ] Color: Green (text-green-500)
- [ ] 💰 Wallet icon visible
- [ ] Shows: $5,000.00
- [ ] Color: Blue (text-blue-500)
- [ ] Both balances are DYNAMIC (not hardcoded)

### **3.3 Navigate to Profile**
```
✓ Click "Profile" in bottom navigation
  OR
✓ Click profile icon in header
```

**VERIFY:**
- [ ] Profile page loads

### **3.4 Check Profile Header (DYNAMIC DATA)**
```
Look at the profile header section:
```

**VERIFY:**
- [ ] Name shows: **Real user name** (NOT "John Doe")
- [ ] Subtitle shows: **Real email** (NOT "Member since January 2024")
- [ ] Points display: 🪙 5,000 pts (green)
- [ ] Cash display: 💰 $5,000.00 (blue)
- [ ] Green circle avatar with user icon

### **3.5 Check Overview Tab Stats**
```
Should be on "Overview" tab by default
```

**VERIFY - DYNAMIC CARDS:**
- [ ] **Points Balance Card** (with green border):
  - Shows: 5,000
  - Has "View Details →" button
- [ ] **Cash Balance Card**:
  - Shows: $5,000.00
  - Text: "Available for cashout"

**VERIFY - PLACEHOLDER CARDS (DIMMED):**
- [ ] **Total Bets Card**:
  - Shows: "-" (not a number)
  - Text: "Coming soon"
  - Dimmed (opacity-60)
- [ ] **Win Rate Card**:
  - Shows: "-"
  - Text: "Coming soon"
  - Dimmed

**VERIFY - RECENT ACTIVITY:**
- [ ] Section visible and dimmed
- [ ] Has "Coming Soon" badge
- [ ] Shows empty state:
  - Trophy icon (gray)
  - "No activity yet"
  - "Start betting to see your activity here"

### **3.6 Check Points Tab**
```
✓ Click "Points" tab (2nd tab)
```

**VERIFY:**
- [ ] 4 stat cards visible with real data:
  - Current Balance: 5,000
  - Total Received: 5,000
  - Used in Bets: 0
  - Pending Requests: 0
- [ ] "Request More" button visible
- [ ] "My Requests" section (empty if first time)
- [ ] "Recent Transactions" section showing allocation

### **3.7 Check Bet History Tab**
```
✓ Click "Bet History" tab
```

**VERIFY:**
- [ ] Has "Coming Soon" badge in header
- [ ] Section is dimmed (opacity-60)
- [ ] Table still shows but is clearly placeholder

---

## **TEST 4: REQUEST POINTS WORKFLOW** (4 min)

### **4.1 User Requests Points**
```
Still in User Portal, on Points tab:
1. Click "Request More" button
2. Modal opens
```

**VERIFY:**
- [ ] Modal title: "Request Points"
- [ ] Amount field (number input)
- [ ] Message field (textarea)
- [ ] "Send Request" button
- [ ] "Cancel" button

```
3. Enter Amount: 2000
4. Enter Message: Need points for betting on matches
5. Click "Send Request"
```

**VERIFY:**
- [ ] Modal closes
- [ ] Success message appears
- [ ] "My Requests" section updates
- [ ] New request visible with:
  - Amount: 2,000 points
  - Status: PENDING (yellow badge)
  - Message: "Need points for betting on matches"
  - Timestamp
  - "Cancel" button available

### **4.2 Broker Sees Request**
```
Switch to Broker window (http://localhost:5174)
Go to Points Management
```

**VERIFY:**
- [ ] "Pending Requests: 1" badge visible on stat card
- [ ] Pending Requests section shows:
  - User name
  - User role: REGULAR_USER
  - Amount: 2,000 points
  - Message: "Need points for betting on matches"
  - Created time
  - Green "Approve" button
  - Red "Reject" button

### **4.3 Broker Approves Request**
```
1. Click green "Approve" button
2. Confirmation if needed
```

**VERIFY:**
- [ ] Request disappears from pending
- [ ] Broker stats update:
  - Allocated: 7,000 (was 5,000)
  - Available: 68,000 (was 70,000)
- [ ] Recent Allocations shows new entry:
  - Type: "Request Approval"
  - Amount: 2,000
  - To: User name

### **4.4 User Receives Points**
```
Switch back to User window
Option A: Wait 30 seconds (auto-refresh)
Option B: Refresh page (Ctrl+R)
```

**VERIFY:**
- [ ] Header balance updated: 🪙 7,000 (was 5,000)
- [ ] Profile → Points tab:
  - Balance: 7,000
  - Total Received: 7,000
- [ ] "My Requests" section:
  - Status changed to: APPROVED (green badge)
  - Approval timestamp shown
- [ ] "Recent Transactions" shows:
  - "+2,000 Approved request: Need points for betting..."

---

## **TEST 5: AUTO-REFRESH** (3 min)

### **5.1 Test Auto-Refresh Without Page Reload**
```
1. Open User Portal in one window
2. Note current balance: 7,000
3. Keep window OPEN (don't refresh)
4. Open Broker Portal in another window
5. Allocate 1,000 more points to user
6. Switch back to User window
7. Wait exactly 30 seconds
8. Watch the header balance
```

**VERIFY:**
- [ ] After 30 seconds, balance auto-updates to 8,000
- [ ] No page refresh needed
- [ ] All balances update (header + profile)
- [ ] No console errors in browser DevTools (F12)

---

## **TEST 6: HIERARCHY VALIDATION** (2 min)

### **6.1 Test Upward Allocation (Should FAIL)**
```
As Broker, try to allocate to Admin or Owner
```

**VERIFY:**
- [ ] Cannot select higher roles in hierarchy
- [ ] Or get error if attempted
- [ ] Message: "Cannot allocate to users higher in hierarchy"

### **6.2 Test Insufficient Balance (Should FAIL)**
```
As Broker with 68,000 available:
Try to allocate 100,000 to user
```

**VERIFY:**
- [ ] Error message appears
- [ ] Message: "Insufficient available points"
- [ ] Allocation not saved
- [ ] Balance unchanged

### **6.3 Test User Cannot Allocate**
```
As Regular User, check Points Management
```

**VERIFY:**
- [ ] Points tab shows stats and requests
- [ ] NO hierarchy table visible
- [ ] NO "Allocate" buttons
- [ ] User can only VIEW and REQUEST

---

## ✅ **QUICK CHECKLIST (All Features)**

### **Backend:**
- [ ] Health check endpoint works
- [ ] Points API endpoints respond
- [ ] Authentication required on protected routes
- [ ] Proper error messages

### **Owner Portal:**
- [ ] Can login
- [ ] Name shows dynamically
- [ ] Points Management page loads
- [ ] Can allocate to anyone
- [ ] Can create points from nothing
- [ ] Stats update correctly

### **Admin Portal:**
- [ ] Can login
- [ ] Name shows dynamically
- [ ] Points Management accessible
- [ ] Can allocate to brokers and users
- [ ] Cannot allocate to owner

### **Broker Portal:**
- [ ] Can login
- [ ] Name shows dynamically
- [ ] Points balance widget on dashboard
- [ ] Points Management page loads
- [ ] Can allocate to users only
- [ ] Can see pending requests
- [ ] Can approve/reject requests
- [ ] Stats update on approval

### **User Portal:**
- [ ] Can login
- [ ] Header shows REAL name/email (not "John Doe")
- [ ] Header shows 🪙 points balance (dynamic)
- [ ] Header shows 💰 cash balance (dynamic)
- [ ] Profile shows REAL name (not "John Doe")
- [ ] Profile shows REAL email (not "Member since...")
- [ ] Points Balance card is dynamic (green border)
- [ ] Cash Balance card is dynamic
- [ ] Betting stats show "-" + "Coming soon"
- [ ] Recent Activity shows empty state
- [ ] Bet History has "Coming Soon" badge
- [ ] Placeholder sections dimmed (opacity-60)
- [ ] Points tab works
- [ ] Can request points
- [ ] Requests show in "My Requests"
- [ ] Approved requests update balance
- [ ] Auto-refresh works (30s)

### **Workflow:**
- [ ] Owner → Broker allocation works
- [ ] Broker → User allocation works
- [ ] User request → Broker approve works
- [ ] Points flow down hierarchy
- [ ] Cannot allocate upward
- [ ] Insufficient balance blocked
- [ ] Stats calculate correctly
- [ ] Available = Balance - Allocated

---

## 🎯 **EXPECTED RESULTS SUMMARY**

After completing all tests:

| User | Balance | Available | Allocated | Status |
|------|---------|-----------|-----------|--------|
| **Owner** | 225,000 | 0 | 225,000 | Can create points |
| **Super Admin** | 100,000 | 100,000 | 0 | Not tested yet |
| **Admin** | 50,000 | 50,000 | 0 | Not tested yet |
| **Broker** | 75,000 | 68,000 | 7,000 | Allocated to user |
| **User** | 7,000 | - | - | Received points ✅ |

### **Points Created by Owner:** 225,000
### **Points Distributed:** 7,000 (to user)
### **Points Available:** 218,000 (across all accounts)

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Backend not responding**
```bash
# Check if running
curl http://localhost:3001/health

# If not:
cd server
npm start

# Check port
netstat -ano | findstr :3001
```

### **Issue: Name still shows "John Doe"**
```
1. Logout completely
2. Clear browser localStorage (F12 → Application → Local Storage → Clear)
3. Login again
4. Check localStorage has 'user' key with name/email
```

### **Issue: Points show "---" or 0**
```
1. Verify backend is running
2. Check browser console (F12) for fetch errors
3. Verify Owner allocated points to broker
4. Verify broker allocated points to user
5. Logout and login again
```

### **Issue: Balances not updating**
```
1. Check browser console for errors
2. Wait full 30 seconds for auto-refresh
3. Or manually refresh (Ctrl+R)
4. Verify network tab shows successful fetch requests
```

### **Issue: Cannot allocate points**
```
1. Check "Available" balance (must be > 0 for lower roles)
2. Owner can always allocate (creates points)
3. Check error message in browser console
4. Verify target user is lower in hierarchy
```

---

## 📊 **VISUAL CONFIRMATION**

### **What You Should See (User Portal):**

#### **Header:**
```
┌────────────────────────────────┐
│  FREEBET   🪙 7,000  💰 $7,000.00  👤 │
└────────────────────────────────┘
             ↑ Green    ↑ Blue
          DYNAMIC    DYNAMIC
```

#### **Profile Header:**
```
┌──────────────────────────────────┐
│  👤  Mohammed Ali  ← REAL NAME   │
│      m.ali@example.com ← REAL    │
│      🪙 7,000 pts  💰 $7,000.00  │
└──────────────────────────────────┘
```

#### **Overview Tab:**
```
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ Points    │ │ Cash      │ │ Total     │ │ Win       │
│ 7,000     │ │ $7,000    │ │ Bets      │ │ Rate      │
│ ✅ DYNAMIC│ │ ✅ DYNAMIC│ │ -         │ │ -         │
│ [Details] │ │           │ │ Coming    │ │ Coming    │
│           │ │           │ │ soon      │ │ soon      │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
   Green         Blue         Dimmed       Dimmed
   Border                     60% opacity  60% opacity
```

---

## 🎉 **SUCCESS CRITERIA**

Phase 4 is COMPLETE when ALL these work:

1. ✅ Owner can create and allocate points
2. ✅ Points flow down hierarchy (Owner → Broker → User)
3. ✅ User sees REAL NAME (not "John Doe")
4. ✅ User sees REAL EMAIL (not "Member since...")
5. ✅ Header shows DYNAMIC balances (points + cash)
6. ✅ Profile shows DYNAMIC balances
7. ✅ User can request points
8. ✅ Broker can approve requests
9. ✅ Points auto-transfer on approval
10. ✅ Balances update correctly
11. ✅ Betting sections show "Coming Soon"
12. ✅ Placeholder sections are dimmed
13. ✅ Auto-refresh works (30 seconds)
14. ✅ Hierarchy restrictions enforced
15. ✅ Insufficient balance blocked

---

## 📝 **TESTING NOTES**

**Total Testing Time:** ~20 minutes

**Test Order:** Must follow in sequence (Owner → Broker → User)

**Browser:** Use Chrome/Firefox, not Safari (better DevTools)

**Windows:** Use 3 separate browser windows or incognito tabs

**Recommended:**
- Keep browser DevTools open (F12)
- Check Console tab for errors
- Check Network tab to see API calls
- Take screenshots of success states

---

## 🚀 **AFTER TESTING**

### **If All Tests Pass:**
1. ✅ Mark this document with timestamp
2. ✅ Phase 4 is VERIFIED!
3. ✅ Ready for Phase 5 (Casino/Sports Integration)

### **If Tests Fail:**
1. Document which test failed
2. Copy error messages from console
3. Check troubleshooting section
4. Report specific issue

### **Next Phase (Phase 5) Will Add:**
- Real casino games integration
- Sports betting functionality
- Bet placement using points
- Win/loss tracking
- Betting history (replace placeholders)
- Win rate calculation
- Recent activity feed

---

## 📞 **NEED HELP?**

If stuck:
1. Check troubleshooting section above
2. Verify all services running
3. Check browser console for errors
4. Try logout/login
5. Clear browser cache/localStorage
6. Restart backend server

---

**Good luck testing! 🧪✨**
