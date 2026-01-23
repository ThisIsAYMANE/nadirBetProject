# 🔐 Permissions Matrix - Multi-Portal Betting Platform

## Role Hierarchy

```
Owner (Level 5) - God Mode
  ↓
Super Admin (Level 4) - Near-God Mode  
  ↓
Admin (Level 3) - Management
  ↓
Broker (Level 2) - Operations
  ↓
Regular User (Level 1) - End User
```

---

## 1. USER MANAGEMENT PERMISSIONS

### **OWNER**
- ✅ **Create**: Super Admin, Admin, Broker, Regular User
- ✅ **View**: ALL users
- ✅ **Edit**: ALL users (including other owners)
- ✅ **Delete**: ALL users (including other owners)
- ✅ **Assign**: Can assign any user to any broker
- 🎯 **Portal Access**: Executive Portal (http://localhost:5173)

### **SUPER ADMIN**
- ✅ **Create**: Admin, Broker, Regular User
- ✅ **View**: ALL users except Owner details
- ✅ **Edit**: ALL users except Owner
- ✅ **Delete**: ALL users except Owner
- ✅ **Assign**: Can assign users to brokers
- 🎯 **Portal Access**: Executive Portal (http://localhost:5173)

### **ADMIN**
- ✅ **Create**: Broker, Regular User
- ✅ **View**: Users they created + users created by their subordinates
- ✅ **Edit**: Users they created + lower hierarchy users
- ✅ **Delete**: Users they created + lower hierarchy users
- ✅ **Assign**: Can assign regular users to brokers
- 🎯 **Portal Access**: Management Portal (http://localhost:5174)

### **BROKER**
- ✅ **Create**: Regular User ONLY
- ✅ **View**: Only their assigned regular users
- ✅ **Edit**: Only their assigned regular users
- ✅ **Delete**: Only their assigned regular users
- ✅ **Assign**: Regular users are AUTO-ASSIGNED to them when they create
- 🎯 **Portal Access**: Management Portal (http://localhost:5174)

### **REGULAR USER**
- ❌ **Create**: NONE
- ✅ **View**: Own profile only
- ✅ **Edit**: Own profile only (limited fields)
- ❌ **Delete**: NONE
- ❌ **Assign**: N/A
- 🎯 **Portal Access**: User Portal (http://localhost:3002)

---

## 2. POINTS MANAGEMENT PERMISSIONS

### **OWNER** 
- ✅ **Infinite Points**: Can create points from nothing (no balance limit)
- ✅ **Allocate To**: Super Admin, Admin, Broker, Regular User
- ✅ **View Balance**: ALL users
- ✅ **View Allocations**: ALL allocations (given + received)
- ✅ **View Requests**: ALL points requests
- ✅ **Approve/Reject**: ALL points requests
- ✅ **View Hierarchy**: Complete points hierarchy tree
- ✅ **Ledger Access**: Full system-wide ledger

### **SUPER ADMIN**
- ⚠️ **Limited Points**: Can only allocate what they have received from Owner
- ✅ **Allocate To**: Admin, Broker, Regular User
- ✅ **View Balance**: Own balance + subordinates
- ✅ **View Allocations**: Own + subordinates
- ✅ **View Requests**: Requests to them + from subordinates
- ✅ **Approve/Reject**: Requests directed to them
- ✅ **View Hierarchy**: Their branch of the tree
- ✅ **Ledger Access**: Own transactions + subordinates

### **ADMIN**
- ⚠️ **Limited Points**: Can only allocate what they have received
- ✅ **Allocate To**: Broker, Regular User
- ✅ **View Balance**: Own balance + subordinates
- ✅ **View Allocations**: Own + subordinates
- ✅ **View Requests**: Requests to them + from subordinates
- ✅ **Approve/Reject**: Requests directed to them
- ✅ **View Hierarchy**: Their branch of the tree
- ✅ **Ledger Access**: Own transactions + subordinates

### **BROKER**
- ⚠️ **Limited Points**: Can only allocate what they have received
- ✅ **Allocate To**: Regular User ONLY
- ✅ **View Balance**: Own balance + assigned regular users
- ✅ **View Allocations**: Own + their regular users
- ✅ **View Requests**: Requests to them + from their users
- ✅ **Approve/Reject**: Requests directed to them
- ✅ **View Hierarchy**: Their regular users only
- ✅ **Ledger Access**: Own transactions + their users

### **REGULAR USER**
- ❌ **Allocate**: CANNOT allocate points
- ✅ **View Balance**: Own balance ONLY
- ✅ **View Allocations**: Allocations received by them
- ✅ **Request Points**: Can request from their broker or up the chain
- ❌ **Approve/Reject**: CANNOT manage requests
- ✅ **View Hierarchy**: None (single user view)
- ✅ **Ledger Access**: Own transactions only

---

## 3. TRANSACTION MANAGEMENT PERMISSIONS

### **OWNER**
- ✅ View: ALL transactions (system-wide)
- ✅ Process: ALL cashout requests
- ✅ Reverse: Can reverse any transaction
- ✅ Audit: Full audit trail access

### **SUPER ADMIN**
- ✅ View: ALL transactions except Owner's personal
- ✅ Process: Cashout requests from subordinates
- ✅ Reverse: Transactions within their hierarchy
- ✅ Audit: Audit trail for their hierarchy

### **ADMIN**
- ✅ View: Transactions in their hierarchy
- ✅ Process: Cashout requests from subordinates
- ⚠️ Reverse: Limited - requires approval
- ✅ Audit: Audit trail for their branch

### **BROKER**
- ✅ View: Own transactions + their regular users
- ✅ Process: Cashout requests from their users
- ❌ Reverse: CANNOT reverse transactions
- ✅ Audit: Limited audit for their users

### **REGULAR USER**
- ✅ View: Own transactions ONLY
- ✅ Request: Can request cashouts
- ❌ Process: CANNOT process anything
- ❌ Reverse: CANNOT reverse
- ✅ Audit: Own transaction history

---

## 4. BROKER-SPECIFIC PERMISSIONS

### **Who Can Create Brokers?**
- ✅ Owner
- ✅ Super Admin  
- ✅ Admin
- ❌ Broker (cannot create other brokers)
- ❌ Regular User

### **Who Can Edit Broker Details?**
- ✅ Owner: ANY broker
- ✅ Super Admin: ANY broker
- ✅ Admin: Brokers they created
- ⚠️ Broker: Own profile only (limited fields)

### **Who Can Delete/Suspend Brokers?**
- ✅ Owner: ANY broker
- ✅ Super Admin: ANY broker
- ✅ Admin: Brokers they created
- ❌ Broker: CANNOT delete brokers

---

## 5. DASHBOARD & ANALYTICS PERMISSIONS

### **OWNER**
- ✅ System-wide KPIs
- ✅ ALL user analytics
- ✅ Revenue reports (complete)
- ✅ Broker performance (all brokers)
- ✅ Charts & graphs (full data)

### **SUPER ADMIN**
- ✅ Near system-wide KPIs (excludes Owner data)
- ✅ User analytics (subordinates)
- ✅ Revenue reports (their hierarchy)
- ✅ Broker performance (subordinate brokers)
- ✅ Charts & graphs (hierarchy data)

### **ADMIN**
- ✅ Branch KPIs
- ✅ User analytics (their branch)
- ✅ Revenue reports (their branch)
- ✅ Broker performance (brokers they manage)
- ✅ Charts & graphs (branch data)

### **BROKER**
- ✅ Own KPIs
- ✅ User analytics (their users only)
- ✅ Revenue reports (own + users)
- ❌ Broker performance (N/A)
- ✅ Charts & graphs (own data)

### **REGULAR USER**
- ✅ Personal stats only
- ✅ Own betting history
- ✅ Points balance
- ✅ Transaction history
- ❌ No analytics/reports

---

## 6. SETTINGS & CONFIGURATION PERMISSIONS

### **OWNER**
- ✅ System settings (all)
- ✅ Security settings
- ✅ API configuration
- ✅ Database management
- ✅ Backup/restore

### **SUPER ADMIN**
- ✅ Most system settings
- ✅ Security settings (limited)
- ⚠️ API configuration (read-only)
- ❌ Database management
- ❌ Backup/restore

### **ADMIN**
- ⚠️ Branch-level settings only
- ❌ Security settings
- ❌ API configuration
- ❌ Database management
- ❌ Backup/restore

### **BROKER**
- ⚠️ Own profile settings
- ❌ Security settings
- ❌ API configuration
- ❌ Database management
- ❌ Backup/restore

### **REGULAR USER**
- ⚠️ Own profile settings (minimal)
- ⚠️ Password change only
- ❌ All other settings

---

## 7. API ENDPOINT PERMISSIONS

### `/api/users`
| Method | Owner | Super Admin | Admin | Broker | Regular User |
|--------|-------|-------------|-------|--------|--------------|
| GET (all) | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET (by ID) | ✅ | ✅ | ⚠️ Own + Subordinates | ⚠️ Own Users | ⚠️ Self Only |
| POST (create) | ✅ | ✅ | ✅ | ⚠️ Regular User Only | ❌ |
| PUT (update) | ✅ | ✅ | ⚠️ Subordinates | ⚠️ Own Users | ⚠️ Self Only |
| DELETE | ✅ | ✅ | ⚠️ Subordinates | ⚠️ Own Users | ❌ |

### `/api/brokers`
| Method | Owner | Super Admin | Admin | Broker | Regular User |
|--------|-------|-------------|-------|--------|--------------|
| GET (all) | ✅ | ✅ | ✅ | ⚠️ Self Only | ❌ |
| GET (by ID) | ✅ | ✅ | ✅ | ⚠️ Self Only | ❌ |
| POST (create) | ✅ | ✅ | ✅ | ❌ | ❌ |
| PUT (update) | ✅ | ✅ | ⚠️ Created by them | ⚠️ Self Only | ❌ |
| DELETE | ✅ | ✅ | ⚠️ Created by them | ❌ | ❌ |

### `/api/points`
| Endpoint | Owner | Super Admin | Admin | Broker | Regular User |
|----------|-------|-------------|-------|--------|--------------|
| `/balance` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/stats` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/allocate` | ✅ (∞) | ✅ | ✅ | ✅ | ❌ |
| `/allocations` | ✅ All | ✅ Hierarchy | ✅ Hierarchy | ✅ Own | ✅ Own |
| `/requests` | ✅ All | ✅ Hierarchy | ✅ Hierarchy | ✅ Own | ✅ Own |
| `/requests/create` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/requests/:id/respond` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/hierarchy` | ✅ Full Tree | ✅ Branch | ✅ Branch | ✅ Users | ❌ |
| `/ledger` | ✅ All | ✅ Hierarchy | ✅ Hierarchy | ✅ Own | ✅ Own |

### `/api/transactions`
| Endpoint | Owner | Super Admin | Admin | Broker | Regular User |
|----------|-------|-------------|-------|--------|--------------|
| GET (all) | ✅ | ✅ | ⚠️ Hierarchy | ⚠️ Own + Users | ⚠️ Self |
| GET (by ID) | ✅ | ✅ | ⚠️ Hierarchy | ⚠️ Accessible | ⚠️ Own |
| POST (create) | ✅ | ✅ | ✅ | ✅ | ✅ |

### `/api/cashout`
| Endpoint | Owner | Super Admin | Admin | Broker | Regular User |
|----------|-------|-------------|-------|--------|--------------|
| GET (requests) | ✅ All | ✅ Hierarchy | ✅ Hierarchy | ✅ Own Users | ⚠️ Own Only |
| POST (create) | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT (approve) | ✅ | ✅ | ✅ | ✅ | ❌ |
| PUT (reject) | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 8. SPECIAL RULES & CONSTRAINTS

### **User Assignment Rules**
- ✅ Regular users **MUST** be assigned to a broker (required)
- ✅ If broker creates user, auto-assigned to them
- ✅ Admin+ can assign regular users to any broker
- ❌ Cannot reassign user to non-broker role

### **Points Flow Rules**
- ✅ **Owner**: Source of all points (infinite supply)
- ⚠️ **Others**: Can only allocate what they have
- ✅ Points flow **downward** only (cannot allocate upward in hierarchy)
- ✅ Can request points **upward** in hierarchy

### **Deletion Rules**
- ⚠️ **Soft Delete**: Users are set to "inactive" not permanently deleted
- ✅ Owner can delete anyone
- ✅ Super Admin cannot delete Owner
- ✅ Users can delete only subordinates or users they created

### **Security Rules**
- ✅ All API routes require authentication (JWT token)
- ✅ Token expires after session
- ✅ Password must be 6+ characters
- ✅ Role-based access control (RBAC) enforced at middleware level

---

## 🧪 TESTING CHECKLIST

### Owner Tests
- [ ] Can create Super Admin
- [ ] Can edit Super Admin
- [ ] Can delete Super Admin
- [ ] Can allocate infinite points
- [ ] Can view all users
- [ ] Can view all transactions
- [ ] Can access Executive Portal

### Super Admin Tests
- [ ] Can create Admin
- [ ] Can edit Admin
- [ ] Cannot delete Owner
- [ ] Can allocate limited points
- [ ] Can view hierarchy
- [ ] Can access Executive Portal

### Admin Tests
- [ ] Can create Broker
- [ ] Can create Regular User
- [ ] Cannot edit Super Admin
- [ ] Can allocate to subordinates
- [ ] Can access Management Portal
- [ ] Cannot access Executive Portal

### Broker Tests
- [ ] Can create Regular User only
- [ ] Regular User auto-assigned to them
- [ ] Can view only their users
- [ ] Can allocate to their users
- [ ] Can access Management Portal
- [ ] Cannot access Executive Portal

### Regular User Tests
- [ ] Cannot create users
- [ ] Can view own profile
- [ ] Can request points
- [ ] Can access User Portal only
- [ ] Cannot access other portals

---

## 📝 NOTES

1. **Hierarchy Enforcement**: All permissions respect the 5-tier hierarchy
2. **Portal Separation**: Different roles access different portals (Executive, Management, User)
3. **Points System**: Owner is the infinite source; all others have limited pools
4. **Audit Trail**: All actions are logged for compliance
5. **Security First**: All routes protected by authentication + authorization middleware

---

**Last Updated**: 2026-01-23
**Version**: Phase 4 (Points Management Implemented)
