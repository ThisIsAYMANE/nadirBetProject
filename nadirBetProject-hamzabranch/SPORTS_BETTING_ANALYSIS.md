# Sports Betting System - Complete Analysis

## Overview
This document provides a comprehensive analysis of the sports betting implementation in the Nadir betting platform. The system supports single bets, accumulator bets, automatic settlement, live odds updates, and comprehensive monitoring dashboards.

---

## Architecture Overview

### Technology Stack
- **Backend**: Node.js/Express with SQLite database
- **Frontend**: React/TypeScript (Next.js for user portal, Vite for admin portals)
- **External API**: The Odds API (api.the-odds-api.com) for odds and scores
- **Database**: SQLite with better-sqlite3

### System Components
1. **Backend Services** (server/src/services/)
   - `BettingService.js` - Core betting logic
   - `OddsAPIService.js` - External API integration
   - `SettlementService.js` - Automatic bet settlement
   - `PointsService.js` - Points management

2. **Frontend Components**
   - **User Portal** (nadir-user/): Betting slip, bet history, live odds
   - **Management Portal** (admin-portal-management/): Bet monitoring dashboard
   - **Executive Portal** (admin-portal-executive/): High-level analytics

---

## Database Schema

### Core Tables

#### `sports_bets`
Stores the main bet records:
- `bet_id` (TEXT, PRIMARY KEY) - UUID
- `user_id` (TEXT, NOT NULL) - References users
- `broker_id` (TEXT) - Optional broker reference
- `bet_type` (TEXT) - 'single' | 'accumulator' | 'system'
- `total_stake` (INTEGER) - Points wagered
- `potential_payout` (INTEGER) - Calculated max payout
- `payout` (INTEGER, DEFAULT 0) - Actual payout after settlement
- `status` (TEXT) - 'pending' | 'won' | 'lost' | 'void' | 'partially_won' | 'cancelled'
- `odds_format` (TEXT, DEFAULT 'decimal')
- `sport_key` (TEXT) - Sport identifier
- `created_at` (TEXT) - ISO timestamp
- `settled_at` (TEXT) - Settlement timestamp
- `settlement_source` (TEXT) - 'auto' | 'manual'

#### `bet_legs`
Stores individual selections within a bet:
- `leg_id` (TEXT, PRIMARY KEY) - UUID
- `bet_id` (TEXT) - References sports_bets
- `sport_key` (TEXT) - Sport identifier
- `league` (TEXT) - League name
- `event_id` (TEXT) - External event ID from Odds API
- `home_team` (TEXT) - Home team name
- `away_team` (TEXT) - Away team name
- `market_type` (TEXT) - Market type (e.g., 'match_winner')
- `selection` (TEXT) - 'home' | 'away' | 'draw'
- `line` (TEXT) - Optional line/handicap
- `odds_when_placed` (REAL) - Odds at bet placement
- `status` (TEXT) - 'pending' | 'won' | 'lost' | 'void'
- `commence_time` (TEXT) - Event start time
- `result_fetched_at` (TEXT) - When result was fetched
- `bookmaker_key` (TEXT) - Bookmaker identifier

#### `odds_cache` (Optional)
For persistent odds caching:
- `cache_key` (TEXT, PRIMARY KEY)
- `sport_key` (TEXT)
- `payload` (TEXT) - JSON cached data
- `created_at` (TEXT)
- `expires_at` (TEXT)

#### `system_bet_combinations` (Future)
For system bets support:
- `combination_id` (TEXT, PRIMARY KEY)
- `bet_id` (TEXT) - References sports_bets
- `legs_json` (TEXT) - JSON array of leg_ids
- `stake` (INTEGER)
- `potential_win` (INTEGER)
- `status` (TEXT)

#### `bet_limits` (Configuration)
Configurable betting limits:
- `limit_id` (TEXT, PRIMARY KEY)
- `role_type` (TEXT) - User role
- `broker_id` (TEXT) - Optional broker-specific limits
- `min_stake` (INTEGER, DEFAULT 1)
- `max_stake` (INTEGER, DEFAULT 1,000,000)
- `max_payout` (INTEGER, DEFAULT 10,000,000)
- `max_legs_in_accumulator` (INTEGER, DEFAULT 10)
- `max_bets_per_day` (INTEGER, DEFAULT 100)
- `allowed_markets` (TEXT) - JSON list
- `is_active` (INTEGER, DEFAULT 1)

### Indexes
- `idx_sports_bets_user_id` - Fast user bet queries
- `idx_sports_bets_status` - Status filtering
- `idx_sports_bets_created_at` - Time-based queries
- `idx_bet_legs_bet_id` - Join optimization
- `idx_bet_legs_event_id` - Settlement lookups

---

## Backend Services

### 1. BettingService (`server/src/services/BettingService.js`)

#### `placeBet(user, betData)`
**Purpose**: Validates and places a bet, deducts points, persists to database.

**Input**:
```javascript
{
  betType: 'single' | 'accumulator',
  stake: number,
  selections: [{
    sportKey: string,
    league?: string,
    eventId: string,
    homeTeam: string,
    awayTeam: string,
    marketType: string,
    selection: 'home' | 'away' | 'draw',
    line?: string,
    odds: number, // decimal odds
    commenceTime?: string,
    bookmakerKey?: string
  }]
}
```

**Validation**:
- At least one selection required
- Bet type matches selection count (single = 1, accumulator ≥ 2)
- Stake: positive integer, 1 ≤ stake ≤ 1,000,000
- Max 20 legs per bet
- All odds > 1 (decimal format)

**Process**:
1. Calculate combined odds: `product of all selection odds`
2. Calculate potential payout: `stake * combinedOdds` (rounded)
3. Deduct points via `PointsService.deductPoints()`
4. Begin database transaction
5. Insert bet record into `sports_bets`
6. Insert each selection as a leg in `bet_legs`
7. Commit transaction
8. Return bet details with new balance

**Returns**:
```javascript
{
  success: true,
  betId: string,
  betType: string,
  totalStake: number,
  potentialPayout: number,
  selections: number,
  newBalance: number
}
```

#### `getUserBets(userId, { status, limit, offset })`
**Purpose**: Fetch user's bet history with optional filtering.

**Returns**: Array of bet records from `sports_bets` table.

#### `getBetWithLegs(betId)`
**Purpose**: Get complete bet details including all legs.

**Returns**:
```javascript
{
  bet: SportsBet,
  legs: BetLeg[]
}
```

#### `getBetsForMonitoring({ brokerId, status, sportKey, limit, offset })`
**Purpose**: Fetch bets for broker/admin monitoring (includes user info).

**Returns**: Array of bets with joined user information.

---

### 2. OddsAPIService (`server/src/services/OddsAPIService.js`)

**Purpose**: Integrates with The Odds API for odds and scores data.

**Configuration**:
- Base URL: `https://api.the-odds-api.com/v4`
- Default region: `eu`
- Default markets: `h2h` (head-to-head)
- Default odds format: `decimal`

**Features**:
- In-memory caching with TTL
- Automatic retry on rate limits (429) and server errors (5xx)
- Rate limit handling with 500ms backoff

#### Methods

**`getSports({ all })`**
- Lists available sports/leagues
- Cache: 30 minutes
- Does NOT count against API quota

**`getOddsForSport(sportKey, options)`**
- Fetches upcoming + live odds for a sport
- Options: `regions`, `markets`, `oddsFormat`, `dateFormat`, `eventIds`
- Cache: 30 seconds

**`getOddsForEvent(eventId, options)`**
- Fetches odds for a specific event
- Supports additional markets (btts, draw_no_bet, etc.)
- Cache: 30 seconds

**`getScores(sportKey, options)`**
- Fetches scores/results for settlement
- Options: `daysFrom`, `dateFormat`, `eventIds`
- Cache: 60 seconds

**`getEvents(sportKey, options)`**
- Fetches fixtures without odds
- Does NOT count against quota
- Cache: 5 minutes

---

### 3. SettlementService (`server/src/services/SettlementService.js`)

**Purpose**: Automatically settles pending bets based on game results.

#### `runSettlementCycle()`
**Purpose**: Main settlement worker that processes all sports with pending bets.

**Process**:
1. Find all sports with pending bets
2. For each sport, call `settleSportBets()`
3. Handles errors per sport (doesn't stop entire cycle)

**Runs**: Every 2 minutes (configurable)

#### `settleSportBets(sportKey)`
**Purpose**: Settle all pending bets for a specific sport.

**Process**:
1. Fetch scores from Odds API (last 1 day)
2. Build `scoresByEventId` map
3. Query pending legs + parent bet info
4. Group legs by `bet_id`
5. For each bet, call `settleSingleBet()`

#### `settleSingleBet(bet, legs, scoresByEventId)`
**Purpose**: Determine leg statuses and update bet accordingly.

**Leg Status Logic** (for `match_winner` market):
- If game not completed → `pending`
- If scores missing → `pending`
- Home score > Away score:
  - Selection 'home' → `won`
  - Selection 'away' or 'draw' → `lost`
- Away score > Home score:
  - Selection 'away' → `won`
  - Selection 'home' or 'draw' → `lost`
- Draw (equal scores):
  - Selection 'draw' → `won`
  - Other selections → `void` (stake refunded)

**Bet Status Logic**:
- If any leg `pending` → bet remains `pending`
- If all legs `void` → bet `void`, payout = stake (refund)
- If any leg `lost` → bet `lost`, payout = 0
- If all legs `won` → bet `won`, payout = `calculateAccumulatorPayout()`
- If mix of `won` + `void` → bet `partially_won`, payout adjusted

**Payout Calculation**:
- For accumulator: `stake * product of winning leg odds`
- For single: `stake * odds`

**Points Credit**:
- If payout > 0, calls `PointsService.addPoints()`
- Transaction type: `bet_won` or `refund`

#### `startSettlementWorker(intervalMs)`
**Purpose**: Start background worker for automatic settlement.

**Default interval**: 2 minutes (120,000ms)
**Initial run**: After 30 seconds

---

### 4. PointsService (`server/src/services/PointsService.js`)

**Key Methods for Betting**:

**`deductPoints(userId, amount, reason, relatedTransactionId)`**
- Validates sufficient balance
- Updates `user_points.current_balance`
- Creates ledger entry with type `bet_placed`
- Returns new balance

**`addPoints(userId, amount, reason, options)`**
- Used for bet wins and refunds
- Options: `{ transactionType: 'bet_won' | 'refund', relatedTransactionId }`
- Updates balance and creates ledger entry

---

## API Routes (`server/src/routes/betting.js`)

### Public Endpoints

**`GET /api/betting/sports`**
- Lists available sports
- Query: `?all=true` for all sports (including inactive)
- No authentication required

**`GET /api/betting/odds/:sportKey`**
- Fetches odds for a sport
- Query params: `regions`, `markets`, `oddsFormat`, `dateFormat`, `eventIds`
- No authentication required

**`GET /api/betting/event/:eventId/odds`**
- Fetches odds for specific event
- Supports additional markets (btts, draw_no_bet, etc.)
- Query params: `regions`, `markets`, `oddsFormat`, `dateFormat`
- No authentication required

### Authenticated Endpoints

**`POST /api/betting/place`**
- Places a bet for authenticated user
- Requires: `authenticateToken` middleware
- Body: `{ betType, stake, selections[] }`
- Returns: `{ success, betId, potentialPayout, newBalance }`

**`GET /api/betting/my-bets`**
- Gets current user's bets
- Query: `?status=pending&limit=50&offset=0`
- Returns: Array of bet records

**`GET /api/betting/bet/:betId`**
- Gets single bet with legs
- User can only view own bets (unless broker/admin)
- Returns: `{ bet, legs }`

**`GET /api/betting/scores/:sportKey`**
- Gets scores for settlement/monitoring
- Requires authentication
- Query: `daysFrom`, `dateFormat`, `eventIds`

**`GET /api/betting/monitor/bets`**
- Monitoring endpoint for brokers/admins
- Requires: `requireMinimumRole('broker')`
- Query: `?status=pending&sportKey=football&limit=100&offset=0`
- Returns: Array of bets with user info

---

## Frontend Implementation

### User Portal (`nadir-user/`)

#### BettingContext (`contexts/BettingContext.tsx`)

**State Management**:
- `betType`: 'single' | 'accumulator'
- `selections`: Array of `BetSelection`
- `stake`: number
- `isPlacing`: boolean

**Methods**:
- `addSelection(selection)` - Adds selection, auto-switches to accumulator if > 1
- `removeSelection(id)` - Removes selection, auto-switches to single if ≤ 1
- `clearSelections()` - Clears all selections
- `setStake(value)` - Updates stake
- `setBetType(type)` - Manually set bet type
- `placeBet()` - Places bet via API, clears slip on success

**BetSelection Type**:
```typescript
{
  id: string,
  sportKey: string,
  league?: string,
  eventId: string,
  homeTeam: string,
  awayTeam: string,
  marketType: 'match_winner',
  selection: 'home' | 'away' | 'draw',
  line?: string,
  odds: number,
  commenceTime?: string,
  bookmakerKey?: string
}
```

#### BettingSlip Component (`components/betting/BettingSlip.tsx`)

**Features**:
- Desktop: Sheet component (right side)
- Mobile: Drawer component (bottom)
- Displays all selections with odds
- Stake input
- Real-time payout calculation
- Place bet button
- Clear all button

**Payout Calculation**:
```typescript
const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1);
const potentialPayout = stake > 0 ? Math.round(stake * totalOdds) : 0;
```

#### BetHistory Component (`components/betting/BetHistory.tsx`)

**Features**:
- Table view of user's bets
- Status filters: All, Pending, Won, Lost
- Auto-refresh every 30 seconds if pending bets exist
- Click to view bet details (legs)
- Shows: Date, Sport, Type, Stake, Potential, Status, Payout

**Bet Details Panel**:
- Shows all legs with status
- Displays odds when placed
- Shows leg-by-leg status (won/lost/pending/void)

#### MatchCard & MatchListRow Components

**Integration**:
- Clicking odds buttons (1, X, 2) calls `addSelection()`
- Passes match data to betting context
- Prevents duplicate selections (same event + market + selection)

#### useLiveOdds Hook (`hooks/useLiveOdds.ts`)

**Purpose**: Fetches and polls live odds data.

**Note**: Currently uses `/api/arbitrage` endpoint, not direct Odds API.

**Features**:
- Polls every 30 seconds (configurable)
- Filters by sport key
- Maps API response to `Match` interface
- Handles errors gracefully

---

### Management Portal (`admin-portal-management/`)

#### BetMonitoringDashboard (`components/betting/BetMonitoringDashboard.tsx`)

**Features**:
- Real-time bet feed
- Status filters: All, Pending, Won, Lost
- Sport filter dropdown
- Auto-refresh every 30 seconds if pending bets
- Stats cards: Total Bets, Stake Volume, Pending Exposure, Settled P&L, Win Rate
- Click to view bet details modal

**Stats Calculation**:
- Total Bets: Count of visible bets
- Total Stake: Sum of `total_stake`
- Pending Exposure: Sum of `potential_payout` for pending bets
- Settled P&L: `sum(payout - stake)` for settled bets
- Win Rate: `(won + partially_won) / settled * 100`

#### BettingStatsCards (`components/betting/BettingStatsCards.tsx`)

**Displays**:
- Total Bets count
- Stake Volume (points)
- Pending Exposure (points, yellow warning)
- Settled P&L (points, color-coded: green/red/gray)
- Win Rate percentage

#### BetDetailsModal (`components/betting/BetDetailsModal.tsx`)

**Shows**:
- User info (name, email)
- Bet summary (type, stake, potential, payout, status)
- Timestamps (placed, settled)
- All legs with:
  - Teams
  - League/sport
  - Market type
  - Selection
  - Odds when placed
  - Leg status

**Future**: Manual settlement controls (void bet, mark as won/lost)

---

## Bet Placement Flow

### User Journey

1. **Browse Matches**
   - User navigates to sport page (e.g., `/sports/football`)
   - Matches displayed via `useLiveOdds` hook
   - Odds shown on `MatchCard` or `MatchListRow`

2. **Add Selections**
   - User clicks odds button (1, X, or 2)
   - `handleAddSelection()` called in match component
   - Selection added to `BettingContext`
   - Bet type auto-switches: 1 selection = single, 2+ = accumulator

3. **Configure Bet**
   - User opens Betting Slip (Sheet/Drawer)
   - Reviews selections
   - Enters stake amount
   - Views calculated potential payout

4. **Place Bet**
   - User clicks "Place Bet"
   - `placeBet()` called in context
   - API call to `POST /api/betting/place`
   - Points deducted immediately
   - Bet saved to database
   - Slip cleared on success
   - Success message shown

5. **View History**
   - User navigates to Profile → Bet History
   - Sees all bets with status
   - Can filter by status
   - Can view bet details (legs)

---

## Settlement Flow

### Automatic Settlement

1. **Settlement Worker**
   - Runs every 2 minutes (configurable)
   - Started on server startup (after 30s delay)

2. **Cycle Process**
   - Finds all sports with pending bets
   - For each sport:
     - Fetches scores from Odds API
     - Queries pending legs
     - Groups by bet_id
     - Settles each bet

3. **Leg Settlement**
   - For each leg:
     - Looks up game result in scores map
     - Determines leg status (won/lost/void/pending)
     - Updates `bet_legs.status`

4. **Bet Settlement**
   - After all legs updated:
     - If any pending → bet remains pending
     - If all void → bet void, refund stake
     - If any lost → bet lost, payout = 0
     - If all won → bet won, payout = calculated
     - If mixed won + void → partially_won, adjusted payout

5. **Points Credit**
   - If payout > 0:
     - Calls `PointsService.addPoints()`
     - Transaction type: `bet_won` or `refund`
     - User balance updated
     - Ledger entry created

---

## Security & Permissions

### Authentication
- JWT tokens required for betting endpoints
- Token stored in `localStorage` (user portal)
- `authenticateToken` middleware validates tokens

### Authorization
- Users can only view own bets
- Brokers can view bets for their users
- Admins can view all bets
- `requireMinimumRole('broker')` for monitoring endpoints

### Validation
- Stake limits: 1 ≤ stake ≤ 1,000,000
- Max legs: 20 per bet
- Odds validation: must be > 1
- Balance check before deduction
- Duplicate selection prevention (same event + market + selection)

---

## Error Handling

### Backend
- Transaction rollback on errors
- Points refunded if bet save fails (after deduction)
- Error messages returned to client
- Logging for debugging

### Frontend
- Try-catch blocks around API calls
- User-friendly error messages
- Loading states during operations
- Graceful degradation (empty states)

---

## Configuration

### Environment Variables

**Backend** (`server/env`):
- `SPORTS_API_KEY` - The Odds API key
- `SPORTS_API_URL` - API base URL (default: https://api.the-odds-api.com/v4)
- `SPORTS_API_REGION` - Default region (default: eu)
- `SPORTS_API_DEFAULT_MARKETS` - Default markets (default: h2h)
- `SPORTS_API_ODDS_FORMAT` - Odds format (default: decimal)

### Constants

**BettingService**:
- `MIN_STAKE = 1`
- `MAX_STAKE = 1,000,000`
- `MAX_LEGS = 20`

**SettlementService**:
- Default interval: 2 minutes
- Initial delay: 30 seconds

---

## Current Limitations & Future Enhancements

### Current Limitations
1. **Market Types**: Only `match_winner` market supported
2. **Settlement Logic**: Basic match-winner only (no totals, handicaps, etc.)
3. **System Bets**: Table exists but not implemented
4. **Manual Settlement**: Not yet implemented in UI
5. **Odds Updates**: No real-time odds updates during bet placement
6. **Bet Limits**: Table exists but not enforced (hardcoded limits)

### Future Enhancements
1. **Additional Markets**:
   - Totals (over/under)
   - Handicaps
   - Both teams to score (BTTS)
   - Draw no bet
   - Double chance

2. **System Bets**:
   - Implement system bet combinations
   - Support for 2/3, 3/4, etc. systems

3. **Enhanced Settlement**:
   - Support for all market types
   - Live betting settlement
   - Partial settlement for live bets

4. **Manual Settlement**:
   - Admin UI for voiding bets
   - Manual win/loss marking
   - Settlement reason tracking

5. **Bet Limits**:
   - Enforce limits from `bet_limits` table
   - Role-based and broker-specific limits
   - Daily bet limits

6. **Real-time Features**:
   - WebSocket for live odds updates
   - Push notifications for bet settlement
   - Live score updates

7. **Analytics**:
   - Betting trends
   - User behavior analysis
   - Risk management metrics
   - Fraud detection

---

## Testing

### Test Plan
See `SPORTS_BETTING_TEST_PLAN.md` for comprehensive test checklist.

### Key Test Scenarios
1. **Bet Placement**:
   - Single bet
   - Accumulator bet
   - Validation errors (insufficient balance, invalid stake, etc.)

2. **Settlement**:
   - Single bet win/loss
   - Accumulator win/loss
   - Void scenarios
   - Partial wins

3. **Permissions**:
   - User can only see own bets
   - Broker sees their users' bets
   - Admin sees all bets

4. **UI/UX**:
   - Betting slip functionality
   - Bet history display
   - Monitoring dashboard
   - Mobile responsiveness

---

## API Integration Details

### The Odds API

**Endpoints Used**:
- `GET /sports` - List sports
- `GET /sports/{sport}/odds` - Get odds
- `GET /events/{eventId}/odds` - Get event odds
- `GET /sports/{sport}/scores` - Get scores

**Rate Limiting**:
- Free tier: 500 requests/month
- Paid tiers: Higher limits
- Service includes retry logic for 429 errors

**Caching Strategy**:
- Sports: 30 minutes
- Odds: 30 seconds
- Scores: 60 seconds
- Events: 5 minutes

---

## Points Integration

### Transaction Types
- `bet_placed` - Points deducted on bet placement
- `bet_won` - Points credited on bet win
- `refund` - Points refunded on bet void

### Ledger Entries
All betting transactions create entries in `points_ledger`:
- `transaction_type`: Type of transaction
- `points_change`: Amount (negative for deductions, positive for credits)
- `balance_before`: Balance before transaction
- `balance_after`: Balance after transaction
- `description`: Human-readable description
- `related_transaction_id`: Optional link to bet_id

---

## Summary

The sports betting system is a comprehensive implementation supporting:

✅ **Core Features**:
- Single and accumulator bets
- Automatic settlement
- Live odds integration
- Points management
- Bet history
- Monitoring dashboards

✅ **Architecture**:
- Clean separation of concerns
- Service-based backend
- Context-based state management
- Responsive UI components

✅ **Data Flow**:
- User selects odds → Betting context → API → Database
- Settlement worker → Odds API → Database → Points service

✅ **Security**:
- JWT authentication
- Role-based authorization
- Input validation
- Transaction safety

The system is production-ready for basic betting operations, with clear paths for future enhancements to support additional markets, system bets, and advanced features.
