## Sports Betting – End‑to‑End Test Plan

This file is a **step‑by‑step checklist** to fully test the sports betting system (user portal + management portal + backend).

---

### 1. Environment & Accounts

1. **Start backend**
   - [*] From the `server` folder, run `npm install` (if not already done).
   - [*] Run `npm start` (or your usual command) and confirm it listens on `http://localhost:3001`.
   - [*] Verify `server/env` (or `.env`) includes valid `SPORTS_API_*` / RapidAPI keys.
2. **Start portals**
   - [*] Start Executive/Owner portal (5173).
   - [*] Start Management portal (5174).
   - [*] Start User portal (3002).
3. **Verify database**
   - [ ] Confirm `sports_bets`, `bet_legs`, `points_ledger`, `points_requests` tables exist.
4. **Accounts**
   - [ ] Ensure you have active accounts for:
     - [ ] `owner`
     - [ ] `super_admin`
     - [ ] `admin`
     - [ ] at least one `broker`
     - [ ] at least one `shop`
     - [ ] at least two `regular_user` accounts, each assigned to a broker/shop.
5. **Initial points allocations**
   - [ ] As **owner**, allocate points to admins/brokers/shops.
   - [ ] As **admin/broker/shop**, allocate points to each test `regular_user` so they can place bets.

---

### 2. Backend Betting API – Smoke Tests (Postman / curl)

1. **Sports & odds (public)**
   - [ ] `GET http://localhost:3001/api/betting/sports`
     - [ ] Response is `200` and returns an array of sports.
   - [ ] `GET http://localhost:3001/api/betting/odds/{sportKey}`
     - [ ] Replace `{sportKey}` with a valid key (e.g. `soccer_epl`).
     - [ ] Response is `200` and contains matches with odds.
2. **User betting (authenticated regular user)**
   - [ ] Log in as a `regular_user` and obtain a JWT token.
   - [ ] `POST http://localhost:3001/api/betting/place`
     - Body example:
       ```json
       {
         "betType": "single",
         "stake": 50,
         "selections": [
           {
             "sportKey": "soccer_epl",
             "league": "EPL",
             "eventId": "SOME_EVENT_ID",
             "homeTeam": "Team A",
             "awayTeam": "Team B",
             "marketType": "match_winner",
             "selection": "home",
             "odds": 2.0
           }
         ]
       }
       ```
     - [ ] Response has `success: true`, a `betId`, and `potentialPayout`.
   - [ ] `GET http://localhost:3001/api/betting/my-bets`
     - [ ] New bet appears with `status: "pending"`, correct `total_stake` and `potential_payout`.
   - [ ] `GET http://localhost:3001/api/betting/bet/{betId}`
     - [ ] Bet and legs are returned and match your selection.
3. **Monitoring (broker/admin)**
   - [ ] Log in as a **broker** and get a token.
   - [ ] `GET http://localhost:3001/api/betting/monitor/bets`
     - [ ] Response `200` and shows bets for users under this broker.
   - [ ] Log in as **admin/owner** and repeat:
     - [ ] Confirm they can see a broader set of bets (per your permission rules).

---

### 3. User Portal – Odds Display & Live Updates

1. **Home page (`/`)**
   - [ ] Open `http://localhost:3002`.
   - [ ] On “Live Now” section:
     - [ ] Live matches (from API or fallback data) are visible.
     - [ ] “LIVE” counts match the number of visible cards.
2. **Sport pages (`/sports/*`)**
   - [ ] Open a few sports pages (e.g. `/sports/football`, `/sports/basketball`).
   - [ ] Confirm:
     - [ ] Matches appear using API data (via `useLiveOdds`).
     - [ ] Odds shown on the buttons look realistic (decimal values).
   - [ ] Wait **≥30 seconds**:
     - [ ] Verify odds refresh without a full page reload (no obvious flicker).

---

### 4. User Portal – Betting Slip & Placement

> Perform these while **logged in as a regular user** with a positive points balance.

1. **Add selections**
   - [ ] From a **MatchCard**:
     - [ ] Click **1** → selection appears in Bet Slip.
     - [ ] Click **2** and/or **X** → additional legs appear (no duplicates for same side/event).
   - [ ] From **MatchListRow** (list view):
     - [ ] Clicking odds buttons adds legs to the same slip.
2. **Bet type behaviour**
   - [ ] With 1 leg → bet type is **Single**.
   - [ ] After adding a 2nd leg → bet type automatically becomes **Combo/Accumulator**.
   - [ ] Removing legs back to 1 → bet type returns to **Single**.
3. **Stake and payout**
   - [ ] Enter a stake (e.g. `100`) in the Bet Slip.
   - [ ] Check “Potential payout”:
     - [ ] For single: `stake * odds` (rounded as in UI).
     - [ ] For combo: `stake * product_of_odds`.
4. **Place successful bet**
   - [ ] Click **Place Bet**.
   - [ ] Confirm:
     - [ ] A success message appears.
     - [ ] Bet Slip is cleared.
     - [ ] User points balance (header/profile) is reduced by the stake.
5. **Validation errors**
   - [ ] Try placing with **no selections**:
     - [ ] You get a message telling you to select at least one bet.
   - [ ] Try placing with **0 or negative stake**:
     - [ ] You get a “Please enter a valid stake” style error.
   - [ ] Try placing a **very large stake** above your balance:
     - [ ] Backend rejects with a clear error and points are not deducted.

---

### 5. User Portal – Authentication Guards

1. **Protected pages**
   - [ ] While logged **out** (remove `token` from `localStorage`):
     - [ ] Navigate to `/profile` → you are redirected to `/`.
     - [ ] Navigate to `/points` → redirected to `/`.
     - [ ] Navigate to `/favorites` → redirected to `/`.
2. **Betting while logged out**
   - [ ] Add selections to the Bet Slip.
   - [ ] Click **Place Bet**:
     - [ ] You see a “You must be logged in to place a bet” message.
     - [ ] No request is sent to `/api/betting/place` (or it returns 401/403 and is handled gracefully).

---

### 6. User Portal – Bet History & Details

> Do this after placing several bets (both singles and combos).

1. **Bet History tab**
   - [ ] Go to `/profile`, log in if needed.
   - [ ] Click the **“Bet History”** tab.
   - [ ] Confirm:
     - [ ] A list of your bets is visible with correct:
       - [ ] Date/time
       - [ ] Type (`single` / `accumulator`)
       - [ ] Stake
       - [ ] Potential payout
       - [ ] Status (pending/won/lost/void/partial)
2. **Filters**
   - [ ] Select **Pending** filter → only pending bets remain.
   - [ ] Select **Won** filter → only won/partially_won bets remain.
   - [ ] Select **Lost** filter → only lost bets remain.
3. **Details view**
   - [ ] Click **View** on one bet:
     - [ ] A details panel opens with:
       - [ ] Bet summary (stake, potential, payout).
       - [ ] List of legs: teams, market, selection, odds, leg status.
   - [ ] For a combo bet:
     - [ ] All legs for that bet_id appear and match what you placed.

---

### 7. Management Portal – Bet Monitoring & Stats

> Test as both **admin** and **broker** on `http://localhost:5174`.

1. **Access & navigation**
   - [ ] Log in as a **broker**.
   - [ ] Open the **“Bet Monitoring”** menu item.
   - [ ] Confirm page loads without CORS/auth errors.
2. **Stats cards**
   - [ ] Verify:
     - [ ] **Total Bets** equals number of rows in the table (for current filters).
     - [ ] **Stake Volume** ≈ sum of `total_stake` for visible bets.
     - [ ] **Pending Exposure** ≈ sum of `potential_payout` for `pending` bets.
3. **Filters**
   - [ ] Change status filter between `All`, `Pending`, `Won`, `Lost`.
     - [ ] Rows update as expected.
   - [ ] Change sport filter (e.g. to one specific `sport_key`).
     - [ ] Only bets for that sport remain.
4. **Role visibility**
   - [ ] As **broker**:
     - [ ] See only bets for users assigned to this broker.
   - [ ] As **admin/owner**:
     - [ ] See bets across the platform (per your permission design).
5. **Bet details modal**
   - [ ] Click **View** on a row:
     - [ ] Modal shows:
       - [ ] User name/email.
       - [ ] Bet type, stake, potential, payout, status.
       - [ ] Legs list matching the user’s Bet History (teams, selection, odds, status).

---

### 8. Settlement Behaviour (Automatic)

> These tests depend on having games that actually complete and are reported by the external scores API.

1. **Single bet settlement**
   - [ ] Place a **single** bet on a match that will complete soon.
   - [ ] Wait for the settlement worker interval (a few minutes).
   - [ ] Check Bet History:
     - [ ] Bet status changes from `pending` to `won` or `lost` (or `void` on a draw).
   - [ ] Check user points:
     - [ ] On win: balance increased by payout; ledger entry type `bet_won`.
     - [ ] On lost: no refund; only original deduction.
     - [ ] On void: stake refunded; ledger entry type `refund`.
2. **Accumulator settlement**
   - [ ] Place a combo bet with at least 2–3 legs.
   - [ ] After games finish and the worker runs:
     - [ ] All legs won → bet status `won`, payout = stake * combined odds.
     - [ ] Any leg lost → bet status `lost`, payout = 0.
     - [ ] Mixed win + void legs → status `partially_won` and payout adjusted accordingly.
3. **Monitoring impact**
   - [ ] In **Bet Monitoring**:
     - [ ] Pending exposure decreases when these bets settle.
     - [ ] Settled P&L and win rate change appropriately.

---

### 9. Permissions & Security

1. **API permissions**
   - [ ] As `regular_user`:
     - [ ] `GET /api/betting/monitor/bets` → 403 Forbidden.
   - [ ] Without token:
     - [ ] `GET /api/betting/my-bets` → 401/403.
     - [ ] `GET /api/betting/bet/{id}` → 401/403.
2. **Cross‑user access**
   - [ ] User A places a bet; note `{betId}`.
   - [ ] Log in as User B:
     - [ ] `GET /api/betting/bet/{betIdOfUserA}` → 403 Forbidden.
   - [ ] Log in as broker of User A:
     - [ ] Same call allowed and returns details.

---

### 10. Regression Checks

1. **Points management**
   - [ ] Owner → Admin/Broker/Shop allocations still work.
   - [ ] Admin/Broker/Shop → User allocations still work.
   - [ ] Points hierarchy and stats pages show correct balances after betting activity.
2. **Non‑betting flows**
   - [ ] Login/logout from all portals.
   - [ ] Navigation to profile, points, favorites, casino still works.
   - [ ] No new console errors in browser dev tools.

