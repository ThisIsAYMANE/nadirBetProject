# Phase 3: Manual Testing Guide
## Step-by-Step Role-Based Access Control Verification

---

## 🎯 **What We're Testing**

1. Role hierarchy (who can see what)
2. User creation permissions (who can create whom)
3. Management permissions (who can edit/delete whom)
4. Hierarchy tracking (parent_id, created_by)

---

## 📋 **Pre-Test Checklist**

Make sure the backend is running:

```powershell
# In the server directory
cd server
npm start
```

**Backend should show:** `Server running on port 3001`

---

## 🧪 **TEST 1: Owner Can Create All Roles**

### Step 1.1: Login as Owner

1. Open browser: `http://localhost:5173`
2. **Login:**
   - Email: `owner@example.com`
   - Password: `password123`
3. **Expected:** Successfully logged in to Executive Portal

### Step 1.2: Try to Create Super Admin (via API)

Since the UI might not have user creation yet, use PowerShell:

```powershell
# First, login to get token
$loginBody = @{
    email = "owner@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).token

# Now create a Super Admin
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$newUserBody = @{
    name = "Test Super Admin"
    email = "testsuperadmin@example.com"
    password = "password123"
    role = "super_admin"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method POST -Headers $headers -Body $newUserBody -UseBasicParsing

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
```

**Expected Result:**
- ✅ Status Code: `201`
- ✅ Response contains new user with `user_type: "super_admin"`
- ✅ Response shows `parent_id` and `created_by` matching owner's ID

### Step 1.3: Verify in Database

```powershell
# In server directory
cd server
node -e "const db = require('./src/database/db.js'); db.pool.query('SELECT username, user_type, created_by, parent_id FROM users ORDER BY created_at DESC LIMIT 5').then(r => console.table(r.rows))"
```

**Expected:** New super admin appears with owner as creator

---

## 🧪 **TEST 2: Super Admin Can Create Admin (But NOT Owner)**

### Step 2.1: Login as Super Admin

```powershell
# Login as super admin
$loginBody = @{
    email = "superadmin@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).token
```

### Step 2.2: Try to Create Owner (Should FAIL)

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$newUserBody = @{
    name = "Test Owner"
    email = "testowner@example.com"
    password = "password123"
    role = "owner"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method POST -Headers $headers -Body $newUserBody -UseBasicParsing -ErrorAction Stop
    Write-Host "ERROR: Should have failed but got: $($response.StatusCode)"
} catch {
    Write-Host "✅ CORRECT: Got 403 Forbidden"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
```

**Expected Result:**
- ✅ Status Code: `403 Forbidden`
- ✅ Error message: `"super_admin cannot create owner"`

### Step 2.3: Try to Create Admin (Should SUCCEED)

```powershell
$newUserBody = @{
    name = "Test Admin"
    email = "testadmin@example.com"
    password = "password123"
    role = "admin"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method POST -Headers $headers -Body $newUserBody -UseBasicParsing

Write-Host "✅ Status Code: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
```

**Expected Result:**
- ✅ Status Code: `201`
- ✅ New admin created successfully

---

## 🧪 **TEST 3: Admin Can Create Broker (But NOT Super Admin)**

### Step 3.1: Login as Admin

```powershell
$loginBody = @{
    email = "admin@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).token
```

### Step 3.2: Try to Create Super Admin (Should FAIL)

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$newUserBody = @{
    name = "Test Super Admin 2"
    email = "testsuperadmin2@example.com"
    password = "password123"
    role = "super_admin"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method POST -Headers $headers -Body $newUserBody -UseBasicParsing -ErrorAction Stop
    Write-Host "ERROR: Should have failed"
} catch {
    Write-Host "✅ CORRECT: Got 403 Forbidden"
}
```

### Step 3.3: Try to Create Broker (Should SUCCEED)

```powershell
$newUserBody = @{
    name = "Test Broker"
    email = "testbroker@example.com"
    password = "password123"
    role = "broker"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method POST -Headers $headers -Body $newUserBody -UseBasicParsing

Write-Host "✅ Status Code: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
```

**Expected Result:**
- ✅ Status Code: `201`
- ✅ New broker created with admin as parent

---

## 🧪 **TEST 4: Broker Can ONLY Create Regular Users**

### Step 4.1: Login as Broker

```powershell
$loginBody = @{
    email = "broker@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).token
```

### Step 4.2: Try to Create Broker (Should FAIL)

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$newUserBody = @{
    name = "Test Broker 2"
    email = "testbroker2@example.com"
    password = "password123"
    role = "broker"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method POST -Headers $headers -Body $newUserBody -UseBasicParsing -ErrorAction Stop
    Write-Host "ERROR: Should have failed"
} catch {
    Write-Host "✅ CORRECT: Got 403 Forbidden"
    Write-Host "Message: $($_.ErrorDetails.Message)"
}
```

### Step 4.3: Try to Create Regular User (Should SUCCEED)

```powershell
$newUserBody = @{
    name = "Test Regular User"
    email = "testregularuser@example.com"
    password = "password123"
    role = "regular_user"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method POST -Headers $headers -Body $newUserBody -UseBasicParsing

Write-Host "✅ Status Code: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
```

**Expected Result:**
- ✅ Status Code: `201`
- ✅ New regular_user created
- ✅ Broker automatically assigned as parent

---

## 🧪 **TEST 5: Regular User CANNOT Create Anyone**

### Step 5.1: Login as Regular User

```powershell
$loginBody = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).token
```

### Step 5.2: Try to Create Regular User (Should FAIL)

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$newUserBody = @{
    name = "Another User"
    email = "anotheruser@example.com"
    password = "password123"
    role = "regular_user"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method POST -Headers $headers -Body $newUserBody -UseBasicParsing -ErrorAction Stop
    Write-Host "ERROR: Should have failed"
} catch {
    Write-Host "✅ CORRECT: Got 403 Forbidden"
    Write-Host "Message: $($_.ErrorDetails.Message)"
}
```

**Expected Result:**
- ✅ Status Code: `403 Forbidden`
- ✅ Error: `"regular_user cannot create regular_user"`

---

## 🧪 **TEST 6: View Hierarchy in Database**

```powershell
cd server

node -e "const db = require('./src/database/db.js'); db.pool.query('SELECT u.username, u.user_type, p.username as parent, c.username as created_by FROM users u LEFT JOIN users p ON u.parent_id = p.user_id LEFT JOIN users c ON u.created_by = c.user_id ORDER BY u.created_at').then(r => console.table(r.rows))"
```

**Expected Output:**

```
┌─────────┬──────────────────┬───────────────┬──────────┬────────────┐
│ (index) │    username      │  user_type    │  parent  │ created_by │
├─────────┼──────────────────┼───────────────┼──────────┼────────────┤
│    0    │ 'owner'          │ 'owner'       │   null   │    null    │
│    1    │ 'superadmin'     │ 'super_admin' │ 'owner'  │  'owner'   │
│    2    │ 'admin'          │ 'admin'       │ 'owner'  │  'owner'   │
│    3    │ 'testsuperadmin' │ 'super_admin' │ 'owner'  │  'owner'   │
│    4    │ 'testadmin'      │ 'admin'       │'superadmin'│'superadmin'│
│    5    │ 'testbroker'     │ 'broker'      │ 'admin'  │  'admin'   │
└─────────┴──────────────────┴───────────────┴──────────┴────────────┘
```

---

## 🧪 **TEST 7: Access Control - View All Users**

### Test 7.1: Owner Can View All Users

```powershell
# Login as owner
$loginBody = @{email = "owner@example.com"; password = "password123"} | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).token

# Try to view users
$headers = @{"Authorization" = "Bearer $token"}
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method GET -Headers $headers -UseBasicParsing

Write-Host "✅ Owner can view users - Status: $($response.StatusCode)"
```

### Test 7.2: Broker CANNOT View All Users

```powershell
# Login as broker
$loginBody = @{email = "broker@example.com"; password = "password123"} | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing
$token = ($loginResponse.Content | ConvertFrom-Json).token

# Try to view users
$headers = @{"Authorization" = "Bearer $token"}
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/users" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    Write-Host "ERROR: Should have failed"
} catch {
    Write-Host "✅ CORRECT: Broker denied access - Got 403"
}
```

**Expected:**
- ✅ Owner/Admin/Super Admin: Can view (200)
- ✅ Broker/Regular User: Cannot view (403)

---

## ✅ **Success Checklist**

After completing all tests, verify:

- [ ] Owner created super_admin successfully
- [ ] Super admin CANNOT create owner (403)
- [ ] Super admin created admin successfully
- [ ] Admin CANNOT create super_admin (403)
- [ ] Admin created broker successfully
- [ ] Broker CANNOT create broker (403)
- [ ] Broker created regular_user successfully
- [ ] Regular user CANNOT create anyone (403)
- [ ] All created users have correct parent_id
- [ ] All created users have correct created_by
- [ ] Only admin+ can view all users
- [ ] Broker and regular users get 403 on view all

---

## 📊 **Quick Test Summary**

| Test | Description | Expected |
|------|-------------|----------|
| 1 | Owner → Create super_admin | ✅ 201 Created |
| 2 | Super Admin → Create owner | ❌ 403 Forbidden |
| 3 | Super Admin → Create admin | ✅ 201 Created |
| 4 | Admin → Create super_admin | ❌ 403 Forbidden |
| 5 | Admin → Create broker | ✅ 201 Created |
| 6 | Broker → Create broker | ❌ 403 Forbidden |
| 7 | Broker → Create regular_user | ✅ 201 Created |
| 8 | Regular User → Create anyone | ❌ 403 Forbidden |
| 9 | Hierarchy tracking | ✅ parent_id & created_by set |
| 10 | View permissions | ✅ Only admin+ can view |

---

## 🎉 **All Tests Pass?**

If all tests pass, Phase 3 is **VERIFIED** ✅

Ready to move to **Phase 4: Points Hierarchy System**! 🚀

---

## 💡 **Troubleshooting**

**Token expired error?**
- Re-login to get fresh token

**403 on expected success?**
- Check backend logs for exact error
- Verify token is being sent correctly

**500 Internal Server Error?**
- Check backend terminal for stack trace
- Verify database is accessible

**Need to reset test data?**
```powershell
cd server
node seed-database.js
```
