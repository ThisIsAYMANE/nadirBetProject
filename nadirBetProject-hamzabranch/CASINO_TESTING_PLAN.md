# 🎰 Slotegrator Casino Integration - Testing Plan

## 📋 Prerequisites

1. **Backend Server** running on `http://localhost:3001`
2. **User Portal** running on `http://localhost:3002` (or `http://localhost:3000` in dev)
3. **ngrok** installed and authenticated
4. **Database migration** completed (`node server/add-casino-tables.js`)
5. **Environment variables** configured in `server/.env`

---

## 🔧 Step 1: Setup ngrok Tunnels

### Install ngrok (if not already installed)

**Windows (PowerShell):**
```powershell
# Using Chocolatey
choco install ngrok

# Or download from: https://ngrok.com/download
```

**Mac/Linux:**
```bash
# Using Homebrew
brew install ngrok

# Or download from: https://ngrok.com/download
```

### Authenticate ngrok
```bash
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

### Start ngrok Tunnels

You need **TWO** ngrok tunnels:

#### Terminal 1: Backend Tunnel (for Callbacks)
```bash
ngrok http 3001 --domain=mazencallback.ngrok.app
```

**Expected Output:**
```
Forwarding  https://mazencallback.ngrok.app -> http://localhost:3001
```

#### Terminal 2: Frontend Tunnel (for Return URL)
```bash
ngrok http 3002 --domain=mazenapp.ngrok.app
```

**Expected Output:**
```
Forwarding  https://mazenapp.ngrok.app -> http://localhost:3002
```

> **Note:** If you don't have reserved domains, use regular ngrok:
> ```bash
> ngrok http 3001  # Will give you a random URL like https://abc123.ngrok-free.app
> ```
> Then update the URLs in `server/.env` accordingly.

### Update Environment Variables

Update `server/.env` with your ngrok URLs:

```env
CASINO_CALLBACK_URL=https://mazencallback.ngrok.app/api/casino/callback
CASINO_RETURN_URL=https://mazenapp.ngrok.app/casino
```

**Important:** The callback URL must point to: `/api/casino/callback`

---

## 🗄️ Step 2: Run Database Migration

```bash
cd server
node add-casino-tables.js
```

**Expected Output:**
```
🎰 Adding casino tables...

Creating game_sessions table...
✅ Created game_sessions
Creating recent_games table...
✅ Created recent_games
Creating casino_transactions table...
✅ Created casino_transactions

Creating indexes...
✅ All indexes created

Checking user_profiles table...
Creating user_profiles table...
✅ Created user_profiles table

✅ Casino tables migration completed successfully!
```

---

## 🚀 Step 3: Start Services

### Terminal 1: Backend Server
```bash
cd server
npm start
```

**Verify:** `http://localhost:3001/health` returns `{"status":"OK"}`

### Terminal 2: User Portal
```bash
cd nadir-user
npm run dev
```

**Verify:** `http://localhost:3002` (or `http://localhost:3000`) loads

### Terminal 3 & 4: ngrok Tunnels (as shown above)

---

## ✅ Step 4: Testing Checklist

### Test 1: Database Migration ✅

- [*] Run `node server/add-casino-tables.js`
- [*] Verify tables created: `game_sessions`, `recent_games`, `casino_transactions`, `user_profiles`
- [*] Check `user_profiles` has `currency` column

**SQLite Check:**
```bash
cd server
sqlite3 data/betting_platform.db
.tables
.schema game_sessions
.schema casino_transactions
```

---

### Test 2: Environment Configuration ✅

- [ ] `CASINO_MERCHANT_ID` is set
- [ ] `CASINO_MERCHANT_KEY` is set
- [ ] `CASINO_API_BASE_URL` points to staging
- [ ] `CASINO_CALLBACK_URL` uses ngrok backend URL
- [ ] `CASINO_RETURN_URL` uses ngrok frontend URL

**Verify:**
```bash
cd server
node -e "require('dotenv').config({path: './env'}); console.log('Merchant ID:', process.env.CASINO_MERCHANT_ID)"
```

---

### Test 3: Backend API - Get Games List ✅

**Endpoint:** `GET http://localhost:3001/api/casino/games`

**Test:**
```bash
curl http://localhost:3001/api/casino/games?perPage=10
```

**Expected:**
- Status: `200 OK`
- Response contains `items` array
- Each game has: `uuid`, `name`, `provider`, `is_mobile`, `has_lobby`, `image`

**Check:**
- [ ] Games list returns successfully
- [ ] Games have required fields
- [ ] No authentication required (public endpoint)

---

### Test 4: Backend API - Get Game Details ✅

**Endpoint:** `GET http://localhost:3001/api/casino/games/:gameId`

**Test:**
```bash
# First, get a game UUID from the games list
curl http://localhost:3001/api/casino/games?perPage=1
# Copy the uuid from response

# Then get game details
curl http://localhost:3001/api/casino/games/{GAME_UUID}
```

**Expected:**
- Status: `200 OK`
- Single game object with all details
- Includes `is_mobile`, `has_lobby`, `provider`, etc.

**Check:**
- [ ] Game details return successfully
- [ ] All game fields present

---

### Test 5: Backend API - Get Enabled Providers ✅

**Endpoint:** `GET http://localhost:3001/api/casino/providers?currency=EUR`

**Test:**
```bash
curl http://localhost:3001/api/casino/providers?currency=EUR
```

**Expected:**
- Status: `200 OK`
- Response contains `currency` and `providers` array
- Providers list shows enabled providers for EUR

**Check:**
- [ ] Providers list returns
- [ ] Currency filtering works
- [ ] Provider names are strings

---

### Test 6: Frontend - Games List Display ✅

**URL:** `http://localhost:3002/casino` (or `http://localhost:3000/casino`)

**Steps:**
1. Open browser to casino page
2. Check browser console (F12) for errors
3. Verify games are loading

**Expected:**
- [ ] Games grid displays
- [ ] Game images load (or placeholder shows)
- [ ] No console errors
- [ ] Loading spinner appears initially, then games

**Check:**
- [ ] Desktop: Only games with `is_mobile === 0` show
- [ ] Mobile: Only games with `is_mobile === 1` show (test on mobile device or resize browser)

---

### Test 7: Frontend - Device Filtering ✅

**Desktop Test:**
1. Open `http://localhost:3002/casino` on desktop browser
2. Open DevTools (F12) → Console
3. Run: `window.innerWidth` (should be > 768px)
4. Check games displayed

**Expected:**
- [ ] Only desktop games (`is_mobile === 0`) are visible
- [ ] No mobile-only games appear

**Mobile Test:**
1. Open `http://localhost:3002/casino` on mobile device OR
2. Use Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12)
4. Check games displayed

**Expected:**
- [ ] Only mobile games (`is_mobile === 1`) are visible
- [ ] No desktop-only games appear

**Check:**
- [ ] Device detection works correctly
- [ ] Games filter by `is_mobile` field
- [ ] Filter updates when window resized

---

### Test 8: Frontend - Game Search & Filters ✅

**URL:** `http://localhost:3002/casino`

**Steps:**
1. Use search box to search for a game name
2. Select a provider from dropdown
3. Click category tabs (Slots, Live, etc.)

**Expected:**
- [ ] Search filters games by name
- [ ] Provider filter works
- [ ] Category tabs filter correctly
- [ ] Empty state shows when no matches

**Check:**
- [ ] Search works in real-time
- [ ] Provider filter updates game list
- [ ] Category filtering works

---

### Test 9: Backend API - Launch Game (Unauthenticated) ❌

**Endpoint:** `POST http://localhost:3001/api/casino/games/:gameId/launch`

**Test:**
```bash
curl -X POST http://localhost:3001/api/casino/games/{GAME_UUID}/launch \
  -H "Content-Type: application/json" \
  -d '{"device":"desktop"}'
```

**Expected:**
- Status: `401 Unauthorized`
- Error message about authentication

**Check:**
- [ ] Unauthenticated requests are rejected
- [ ] Proper error message returned

---

### Test 10: Backend API - Launch Game (Authenticated) ✅

**Prerequisites:**
- User account created and logged in
- Get JWT token from login

**Test:**
```bash
# First, login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Copy the token from response, then:
curl -X POST http://localhost:3001/api/casino/games/{GAME_UUID}/launch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"device":"desktop","language":"en"}'
```

**Expected:**
- Status: `200 OK`
- Response contains `url`, `sessionId`, `gameId`
- Game URL is a valid Slotegrator launch URL

**Check:**
- [ ] Game launch succeeds with valid token
- [ ] Launch URL is returned
- [ ] Session ID is generated
- [ ] Game session created in database

**Database Verification:**
```bash
sqlite3 server/data/betting_platform.db
SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT 1;
```

---

### Test 11: Frontend - Launch Game (UI) ✅

**URL:** `http://localhost:3002/casino`

**Steps:**
1. Login to user portal
2. Navigate to casino page
3. Click "Play" button on any game
4. Game launch modal should open

**Expected:**
- [ ] Modal opens with game name
- [ ] Loading spinner appears
- [ ] Game iframe loads (or error message if not logged in)
- [ ] Game plays in iframe

**Check:**
- [ ] Modal opens correctly
- [ ] Loading state works
- [ ] Game launches successfully
- [ ] Iframe displays game
- [ ] Close button works

**Error Cases:**
- [ ] Not logged in → Shows login prompt
- [ ] Provider not enabled → Shows error message
- [ ] Game not found → Shows 404 error

---

### Test 12: Backend API - Transaction Callback (Balance) ✅

**Endpoint:** `POST https://mazencallback.ngrok.app/api/casino/callback`

**Test:**
```bash
# Simulate balance check callback from Slotegrator
curl -X POST https://mazencallback.ngrok.app/api/casino/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Merchant-Id: 918cde05a40c71c00e2794acdd196337" \
  -H "X-Timestamp: $(date +%s)" \
  -H "X-Nonce: $(openssl rand -hex 16)" \
  -d "action=balance&player_id=USER_ID&transaction_id=TEST_BALANCE_001&game_uuid=TEST_GAME&amount=0&currency=EUR"
```

**Note:** You'll need to generate the X-Sign header. For testing, you can temporarily disable signature validation or use a test script.

**Expected:**
- Status: `200 OK`
- Response contains `balance` (user's current balance)
- Response contains `transaction_id`

**Check:**
- [ ] Callback endpoint accessible via ngrok
- [ ] Balance request returns current balance
- [ ] Transaction recorded in database

---

### Test 13: Backend API - Transaction Callback (Bet) ✅

**Test:**
```bash
# Simulate bet callback
curl -X POST https://mazencallback.ngrok.app/api/casino/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Merchant-Id: 918cde05a40c71c00e2794acdd196337" \
  -H "X-Timestamp: $(date +%s)" \
  -H "X-Nonce: $(openssl rand -hex 16)" \
  -d "action=bet&player_id=USER_ID&transaction_id=TEST_BET_001&game_uuid=TEST_GAME&amount=100&currency=EUR&session_id=SESSION_ID"
```

**Expected:**
- Status: `200 OK`
- Response contains `balance` (reduced by bet amount)
- Points deducted from user account
- Transaction recorded in `casino_transactions` table

**Check:**
- [ ] Bet callback processes successfully
- [ ] User balance decreases
- [ ] Transaction status is `completed`
- [ ] Game session `total_bet` updated

**Database Verification:**
```sql
SELECT * FROM casino_transactions WHERE transaction_id = 'TEST_BET_001';
SELECT * FROM user_points WHERE user_id = 'USER_ID';
SELECT * FROM game_sessions WHERE session_token = 'SESSION_ID';
```

---

### Test 14: Backend API - Transaction Callback (Win) ✅

**Test:**
```bash
# Simulate win callback
curl -X POST https://mazencallback.ngrok.app/api/casino/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Merchant-Id: 918cde05a40c71c00e2794acdd196337" \
  -H "X-Timestamp: $(date +%s)" \
  -H "X-Nonce: $(openssl rand -hex 16)" \
  -d "action=win&player_id=USER_ID&transaction_id=TEST_WIN_001&game_uuid=TEST_GAME&amount=200&currency=EUR&session_id=SESSION_ID"
```

**Expected:**
- Status: `200 OK`
- Response contains `balance` (increased by win amount)
- Points credited to user account
- Transaction recorded

**Check:**
- [ ] Win callback processes successfully
- [ ] User balance increases
- [ ] Transaction recorded
- [ ] Game session `total_win` updated

---

### Test 15: Backend API - Transaction Callback (Refund) ✅

**Test:**
```bash
# Simulate refund callback
curl -X POST https://mazencallback.ngrok.app/api/casino/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Merchant-Id: 918cde05a40c71c00e2794acdd196337" \
  -H "X-Timestamp: $(date +%s)" \
  -H "X-Nonce: $(openssl rand -hex 16)" \
  -d "action=refund&player_id=USER_ID&transaction_id=TEST_REFUND_001&game_uuid=TEST_GAME&amount=100&currency=EUR&bet_transaction_id=TEST_BET_001"
```

**Expected:**
- Status: `200 OK`
- Original bet amount refunded
- Balance restored
- Refund transaction recorded

**Check:**
- [ ] Refund processes correctly
- [ ] Original bet amount refunded
- [ ] Balance restored
- [ ] Transaction linked to original bet

---

### Test 16: Backend API - Transaction Callback (Rollback) ✅

**Test:**
```bash
# Simulate rollback callback
curl -X POST https://mazencallback.ngrok.app/api/casino/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Merchant-Id: 918cde05a40c71c00e2794acdd196337" \
  -H "X-Timestamp: $(date +%s)" \
  -H "X-Nonce: $(openssl rand -hex 16)" \
  -d "action=rollback&player_id=USER_ID&transaction_id=TEST_ROLLBACK_001&game_uuid=TEST_GAME&amount=0&currency=EUR&rollback_transactions=[{\"action\":\"bet\",\"amount\":100},{\"action\":\"win\",\"amount\":200}]"
```

**Expected:**
- Status: `200 OK`
- All transactions in rollback list reversed
- Balance adjusted correctly
- Rollback transaction recorded

**Check:**
- [ ] Rollback processes all transactions
- [ ] Bets refunded, wins deducted
- [ ] Balance correct after rollback

---

### Test 17: Backend API - Transaction Idempotency ✅

**Test:**
1. Send the same callback twice with same `transaction_id`
2. Verify second call returns same result without duplicate processing

**Expected:**
- [ ] First call processes transaction
- [ ] Second call returns same balance without processing
- [ ] No duplicate transactions in database
- [ ] Transaction status remains `completed`

---

### Test 18: Backend API - Insufficient Funds ✅

**Test:**
1. Set user balance to 50 points
2. Send bet callback for 100 points

**Expected:**
- Status: `200 OK` (Slotegrator expects 200 even for errors)
- Response contains `error_code: 'INSUFFICIENT_FUNDS'`
- No points deducted
- Transaction status is `failed`

**Check:**
- [ ] Error code returned correctly
- [ ] Balance unchanged
- [ ] Transaction marked as failed

---

### Test 19: Frontend - Currency Selector ✅

**URL:** `http://localhost:3002/profile?tab=settings`

**Steps:**
1. Login to user portal
2. Navigate to Profile → Settings tab
3. View currency selector
4. Change currency (e.g., EUR → USD)

**Expected:**
- [ ] Currency selector displays
- [ ] Current currency is selected
- [ ] Available currencies shown
- [ ] Currency change saves successfully
- [ ] Page refreshes after change
- [ ] Game list updates (if on casino page)

**Check:**
- [ ] Currency updates in database
- [ ] Profile endpoint returns new currency
- [ ] Games list filters by new currency providers

**Database Verification:**
```sql
SELECT currency FROM user_profiles WHERE user_id = 'USER_ID';
```

---

### Test 20: Backend API - Recent Games ✅

**Endpoint:** `GET http://localhost:3001/api/casino/recent`

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/casino/recent?limit=10
```

**Expected:**
- Status: `200 OK`
- Response contains `games` array
- Games ordered by `last_played` DESC
- Limited to requested limit

**Check:**
- [ ] Recent games return for logged-in user
- [ ] Games ordered correctly
- [ ] Limit works

---

### Test 21: Backend API - Game History ✅

**Endpoint:** `GET http://localhost:3001/api/casino/history`

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/casino/history?limit=50&action=bet"
```

**Expected:**
- Status: `200 OK`
- Response contains `transactions` array
- Filters work (gameId, action)
- Limited to requested limit

**Check:**
- [ ] History returns transactions
- [ ] Filters work correctly
- [ ] Limit works

---

### Test 22: Lobby Games ✅

**Steps:**
1. Find a game with `has_lobby === 1` in games list
2. Launch the game
3. Verify lobby flow

**Expected:**
- [ ] Backend calls `/games/lobby` endpoint
- [ ] Lobby data retrieved
- [ ] Lobby data passed to `/games/init`
- [ ] Game launches successfully

**Check:**
- [ ] Lobby games handled correctly
- [ ] No errors in console
- [ ] Game launches after lobby

---

### Test 23: Provider Enablement Check ✅

**Steps:**
1. Set user currency to EUR
2. Find a game from a provider not enabled for EUR
3. Try to launch the game

**Expected:**
- [ ] Launch fails with 403 error
- [ ] Error message indicates provider not enabled
- [ ] No game session created

**Check:**
- [ ] Provider check works
- [ ] Proper error returned
- [ ] No partial data created

---

### Test 24: Error Handling ✅

**Test Cases:**

1. **Invalid Game UUID:**
   ```bash
   curl -X POST http://localhost:3001/api/casino/games/INVALID_UUID/launch \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"device":"desktop"}'
   ```
   - [ ] Returns 404 or 400 error
   - [ ] Error message is clear

2. **Invalid Currency:**
   ```bash
   curl -X PUT http://localhost:3001/api/users/profile \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"currency":"INVALID"}'
   ```
   - [ ] Returns 400 error
   - [ ] Error message indicates invalid currency

3. **Missing Authentication:**
   - [ ] All protected endpoints require auth
   - [ ] Proper 401 errors returned

---

## 🐛 Troubleshooting

### Issue: ngrok tunnel not accessible

**Solution:**
- Check ngrok is running: `ngrok status`
- Verify port is correct: `ngrok http 3001`
- Check firewall/antivirus isn't blocking
- Try restarting ngrok

### Issue: Callback signature validation fails

**Solution:**
- Verify `CASINO_MERCHANT_KEY` is correct
- Check X-Sign calculation in `CasinoApiService.js`
- Ensure headers are passed correctly
- Temporarily disable validation for testing (NOT for production!)

### Issue: Games not loading

**Solution:**
- Check backend API: `curl http://localhost:3001/api/casino/games`
- Check browser console for errors
- Verify CORS is configured correctly
- Check network tab for failed requests

### Issue: Device filtering not working

**Solution:**
- Verify `useMediaQuery` hook is working
- Check `is_mobile` field in game data
- Test with actual device or Chrome DevTools device emulation
- Clear browser cache

### Issue: Game launch fails

**Solution:**
- Check user is logged in
- Verify JWT token is valid
- Check provider is enabled for user's currency
- Check game UUID is valid
- Review backend logs for errors

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Test # | Test Name | Status | Notes
-------|-----------|--------|-------
1      | Database Migration | ✅/❌ | 
2      | Environment Config | ✅/❌ |
3      | Get Games List | ✅/❌ |
4      | Get Game Details | ✅/❌ |
5      | Get Providers | ✅/❌ |
6      | Frontend Games Display | ✅/❌ |
7      | Device Filtering | ✅/❌ |
8      | Search & Filters | ✅/❌ |
9      | Launch (Unauth) | ✅/❌ |
10     | Launch (Auth) | ✅/❌ |
11     | Frontend Launch | ✅/❌ |
12     | Callback Balance | ✅/❌ |
13     | Callback Bet | ✅/❌ |
14     | Callback Win | ✅/❌ |
15     | Callback Refund | ✅/❌ |
16     | Callback Rollback | ✅/❌ |
17     | Idempotency | ✅/❌ |
18     | Insufficient Funds | ✅/❌ |
19     | Currency Selector | ✅/❌ |
20     | Recent Games | ✅/❌ |
21     | Game History | ✅/❌ |
22     | Lobby Games | ✅/❌ |
23     | Provider Check | ✅/❌ |
24     | Error Handling | ✅/❌ |

Overall Status: ✅ PASS / ❌ FAIL
Issues Found: ___________
```

---

## 🎯 Success Criteria

All tests must pass for production deployment:

- ✅ All backend endpoints respond correctly
- ✅ Frontend displays games correctly
- ✅ Device filtering works (mobile/desktop)
- ✅ Game launch works for authenticated users
- ✅ Transaction callbacks process correctly
- ✅ Currency management works
- ✅ Error handling is robust
- ✅ No security vulnerabilities
- ✅ Database operations are correct

---

## 📝 Notes

- Keep ngrok tunnels running during all tests
- Use real Slotegrator staging credentials
- Test with actual game launches when possible
- Monitor database for data integrity
- Check logs for any errors or warnings
- Document any issues found

---

**Last Updated:** 2025-01-24
**Version:** 1.0
