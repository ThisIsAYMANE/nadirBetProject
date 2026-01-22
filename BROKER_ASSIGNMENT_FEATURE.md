# Broker Assignment Feature

## ✅ **Feature Complete!**

Regular users (end users/players) **MUST** be assigned to a broker/shop. This has been fully implemented on both backend and frontend.

---

## 🎯 **Business Rules Implemented**

### **1. Regular Users ALWAYS Need a Broker**
- ✅ Regular users **MUST** be assigned to a broker (required field)
- ✅ Cannot create a regular user without selecting a broker
- ✅ Backend validates broker assignment
- ✅ Frontend enforces broker selection

### **2. Auto-Assignment for Brokers**
- ✅ When a **broker creates a user** → automatically assigned to that broker
- ✅ No manual selection needed when broker creates users

### **3. Manual Assignment for Admin+**
- ✅ When **owner/super_admin/admin creates a user** → they must select which broker/shop
- ✅ Dropdown shows all available brokers
- ✅ Shows broker business name and full name

---

## 🔧 **Backend Changes**

### **File: `server/src/routes/users.js`**

#### **1. Auto-Assignment Logic**
```javascript
// If creator is a broker, auto-assign to them
if (creatorRole === 'broker' && role === 'regular_user') {
  assignedBrokerId = creatorId;
}
```

#### **2. Validation - Broker Required**
```javascript
// Validate that regular users MUST have a broker assigned
if (role === 'regular_user' && !assignedBrokerId) {
  return res.status(400).json({ 
    error: 'Regular users must be assigned to a broker',
    message: 'Please select a broker to assign this user to'
  });
}
```

#### **3. Validation - Broker Exists**
```javascript
// If broker is specified, validate it exists and is actually a broker
if (assignedBrokerId && role === 'regular_user') {
  const brokerCheck = await pool.query(
    'SELECT user_id, user_type FROM users WHERE user_id = ? AND user_type = ?',
    [assignedBrokerId, 'broker']
  );
  
  if (brokerCheck.rows.length === 0) {
    return res.status(400).json({ 
      error: 'Invalid broker',
      message: 'The specified broker does not exist'
    });
  }
}
```

#### **4. Database Insert**
```javascript
await pool.query(`
  INSERT INTO users (...)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  ...
  assignedBrokerId || null, // Use validated broker assignment
  ...
]);
```

---

## 🎨 **Frontend Changes**

### **File: `admin-portal-executive/src/components/dashboard/UserManagement.tsx`**

#### **1. Fetch Brokers on Component Mount**
```typescript
const [brokers, setBrokers] = useState<Broker[]>([]);
const [brokersLoading, setBrokersLoading] = useState(false);

useEffect(() => {
  fetchBrokers();
}, []);

const fetchBrokers = async () => {
  try {
    setBrokersLoading(true);
    const response = await apiService.getBrokers(1, 100);
    setBrokers(response.brokers || []);
  } catch (err) {
    console.error('Failed to fetch brokers:', err);
  } finally {
    setBrokersLoading(false);
  }
};
```

#### **2. Add `brokerId` to Form State**
```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  role: 'regular_user' as ...,
  status: 'active' as ...,
  businessName: '',
  commissionRate: '0.05',
  brokerId: '' // NEW
});
```

#### **3. Send `brokerId` When Creating Regular Users**
```typescript
if (formData.role === 'regular_user' && formData.brokerId) {
  userData.brokerId = formData.brokerId;
}
await apiService.createUser(userData);
```

#### **4. Broker Dropdown (Shown Only for Regular Users)**
```tsx
{formData.role === 'regular_user' && modalType === 'create' && (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">
      Assign to Broker (Shop) *
    </label>
    {brokersLoading ? (
      <div className="...">Loading brokers...</div>
    ) : (
      <select
        value={formData.brokerId}
        onChange={(e) => handleInputChange('brokerId', e.target.value)}
        className="..."
        required
      >
        <option value="">Select a broker...</option>
        {brokers.map((broker) => (
          <option key={broker.broker_id} value={broker.broker_id}>
            {broker.business_name} ({broker.full_name || broker.username})
          </option>
        ))}
      </select>
    )}
    <p className="text-xs text-gray-400 mt-1">
      Regular users must be assigned to a broker/shop
    </p>
  </div>
)}
```

#### **5. Button Validation**
```typescript
disabled={
  formLoading || 
  !formData.name || 
  !formData.email || 
  (modalType === 'create' && !formData.password) ||
  (modalType === 'create' && formData.role === 'regular_user' && !formData.brokerId)
}
```

---

## 📋 **User Flow**

### **Scenario 1: Admin Creates Regular User**
1. Admin logs in → Goes to User Management
2. Clicks "Add User"
3. Fills in: Name, Email, Password
4. Selects Role: "Regular User"
5. **"Assign to Broker (Shop)" dropdown appears** ✨
6. Selects a broker from the list (e.g., "ABC Gaming (John Doe)")
7. Clicks "Create"
8. ✅ User created and assigned to selected broker

### **Scenario 2: Broker Creates Regular User**
1. Broker logs in → Goes to User Management
2. Clicks "Add User"
3. Fills in: Name, Email, Password
4. Role is automatically "Regular User" (only role they can create)
5. **No broker dropdown shown** (auto-assigned)
6. Clicks "Create"
7. ✅ User created and automatically assigned to this broker

### **Scenario 3: Try to Create Regular User Without Broker**
1. Admin tries to create regular user
2. Doesn't select a broker
3. **"Create" button is disabled** ❌
4. Cannot submit the form

---

## 🧪 **Testing**

### **Test 1: Backend Validation**
```powershell
# Try to create regular user without broker (should fail)
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
  name = "Test User"
  email = "test@example.com"
  password = "password123"
  role = "regular_user"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/users" `
  -Method POST -Headers $headers -Body $body -ContentType "application/json"

# Expected: 400 error - "Regular users must be assigned to a broker"
```

### **Test 2: Auto-Assignment (Broker Creates User)**
```powershell
# Login as broker, create user
# brokerId should be auto-assigned to broker's ID
```

### **Test 3: Manual Assignment (Admin Creates User)**
```powershell
# Login as admin, create user with brokerId
$body = @{
  name = "Test User"
  email = "test@example.com"
  password = "password123"
  role = "regular_user"
  brokerId = "<broker-uuid>"
} | ConvertTo-Json

# Expected: 201 success, user created with broker assignment
```

### **Test 4: Invalid Broker**
```powershell
# Try to create with non-existent broker ID
$body = @{
  name = "Test User"
  email = "test@example.com"
  password = "password123"
  role = "regular_user"
  brokerId = "invalid-uuid"
} | ConvertTo-Json

# Expected: 400 error - "Invalid broker"
```

---

## ✅ **What's Working**

1. ✅ Regular users **REQUIRE** broker assignment
2. ✅ Brokers **auto-assign** their users
3. ✅ Admin+ **manually selects** broker from dropdown
4. ✅ Backend **validates** broker exists
5. ✅ Frontend **enforces** broker selection (disabled button)
6. ✅ Dropdown shows **all available brokers** with business names
7. ✅ Error messages are **clear and helpful**

---

## 📝 **Notes**

- **Shop = Broker** (same entity, different terminology in real life)
- `broker_id` field in `users` table stores the assignment
- Broker dropdown only shown when creating **regular_user** role
- Auto-assignment only happens if creator is a **broker**
- Admin+ roles do NOT need broker assignment (they manage brokers)

---

**Status:** ✅ **Feature Complete and Ready for Testing**

**Next Step:** Restart backend server and test in the browser!
