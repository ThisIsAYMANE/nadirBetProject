# The Odds API Market Inspection Scripts

These scripts help you inspect the structure and available markets from The Odds API to understand how to display different betting markets in your application.

## Prerequisites

1. **API Key**: Make sure you have `SPORTS_API_KEY` set in your `server/env` file
2. **Node.js**: Scripts use ES modules (Node 14+)

## Available Scripts

### 1. `auto-fetch-all-markets.js` - ⭐ EASIEST: Auto-Fetch All Markets

**RECOMMENDED STARTING POINT** - Automatically finds an event and fetches ALL available markets including player props.

```bash
# NFL with all markets (default)
node scripts/auto-fetch-all-markets.js

# NBA with all markets
node scripts/auto-fetch-all-markets.js basketball_nba us

# Soccer with all markets
node scripts/auto-fetch-all-markets.js soccer_epl eu
```

**What it does:**
- Finds the first available event for the sport
- Fetches ALL market types (featured, soccer, player props, periods)
- Shows organized results by category
- Saves complete analysis to JSON file

**Use this to:**
- See ALL available markets for a sport at once
- Understand market structure including player props
- Get a complete picture of what's available

---

### 2. `fetch-all-markets.js` - Fetch All Markets for Specific Event

Fetches ALL available markets for a specific event ID (including player props).

```bash
# You need the eventId first (get it from quick-inspect-event.js)
node scripts/fetch-all-markets.js <eventId> <sportKey> <region>

# Example: NFL event
node scripts/fetch-all-markets.js a512a48a58c4329048174217b2cc7ce0 americanfootball_nfl us

# Example: Soccer event
node scripts/fetch-all-markets.js abc123def456 soccer_epl eu
```

**What it fetches:**
- ✅ Featured markets (h2h, spreads, totals)
- ✅ Soccer markets (btts, draw_no_bet, double_chance, etc.)
- ✅ Player props (NFL, NBA, MLB, NHL, Soccer)
- ✅ Period markets (quarters, halves, innings)
- ✅ Alternate markets (alternate spreads, alternate totals)

**Output:**
- Organized by category (Featured, Soccer, Player Props, Periods)
- Shows sample outcomes for each market
- Lists all bookmakers offering each market
- Saves complete results to JSON

**Use this to:**
- Get comprehensive market analysis for a specific event
- See player props structure (like the example you showed)
- Understand all available betting options

---

### 3. `list-sports.js` - List All Available Sports

Lists all sports/leagues available from The Odds API.

```bash
cd server
node scripts/list-sports.js
```

**Output:**
- Displays all sports grouped by category
- Saves full list to `server/data/available-sports.json`

**Use this to:**
- Find the correct `sportKey` for your sport
- See what sports are available in your region

---

### 2. `quick-inspect-event.js` - Quick Market Inspection

Fetches the first available event for a sport and shows all available markets.

```bash
# Default: Inspect EPL (soccer_epl)
node scripts/quick-inspect-event.js

# Inspect a specific sport
node scripts/quick-inspect-event.js basketball_nba
node scripts/quick-inspect-event.js americanfootball_nfl
```

**Output:**
- Shows all markets available for the event
- Displays outcomes for each market
- Shows JSON structure
- Saves full response to `server/data/event-markets-{timestamp}.json`

**Use this to:**
- Quickly see what markets are available for a sport
- Understand the structure of market responses
- See what outcomes are available for each market type

---

### 3. `inspect-odds-api-markets.js` - Comprehensive Market Inspector

Full-featured inspector with options for specific events, markets, and regions.

```bash
# Basic usage - inspect EPL with default markets
node scripts/inspect-odds-api-markets.js

# Inspect specific sport
node scripts/inspect-odds-api-markets.js --sport=basketball_nba

# Inspect specific event (get eventId from quick-inspect-event.js)
node scripts/inspect-odds-api-markets.js --event=abc123def456

# Request specific markets
node scripts/inspect-odds-api-markets.js --sport=soccer_epl --markets=h2h,btts,draw_no_bet

# Inspect US markets
node scripts/inspect-odds-api-markets.js --sport=americanfootball_nfl --regions=us

# Get help
node scripts/inspect-odds-api-markets.js --help
```

**Options:**
- `--sport=<sportKey>` - Sport to inspect (default: `soccer_epl`)
- `--event=<eventId>` - Specific event ID
- `--markets=<markets>` - Comma-separated markets (default: `h2h,spreads,totals,btts,draw_no_bet,alternate_spreads,alternate_totals`)
- `--regions=<regions>` - Comma-separated regions: `us,uk,au,eu` (default: `eu`)

**Output:**
- Detailed analysis of all events
- Summary of all unique markets found
- Sample structures for each market type
- Full API response saved to `server/data/odds-api-response-{timestamp}.json`

**Use this to:**
- Deep dive into market structures
- Compare markets across multiple events
- Understand which markets are available for which sports

---

## Understanding Market Types

### ⚠️ Important: Two Different Endpoints

1. **`/sports/{sport}/odds`** - Basic markets only (h2h, spreads, totals)
2. **`/events/{eventId}/odds`** - ALL markets including player props, additional markets

**To see ALL markets (including player props), you MUST use the event-specific endpoint!**

### Featured Markets (Available on both endpoints)

- **`h2h`** - Head to Head / Moneyline (Match Winner)
  - Outcomes: `home`, `away`, `draw` (for soccer)
  
- **`spreads`** - Point Spreads / Handicaps
  - Outcomes: `home`, `away` with `point` values
  
- **`totals`** - Over/Under (Total Points/Goals)
  - Outcomes: `over`, `under` with `point` values

### Additional Markets (ONLY Available on `/events/{eventId}/odds`)

These markets require the event-specific endpoint:

- **`btts`** - Both Teams to Score (Soccer)
  - Outcomes: `Yes`, `No`
  
- **`draw_no_bet`** - Draw No Bet (Soccer)
  - Outcomes: `home`, `away` (draw refunds bet)
  
- **`alternate_spreads`** - Alternate Spreads
  - Multiple spread options with different point values
  
- **`alternate_totals`** - Alternate Totals
  - Multiple over/under options with different point values
  
- **`team_totals`** - Team Totals
  - Over/under for individual team scores
  
- **`double_chance`** - Double Chance (Soccer)
  - Outcomes: `1X`, `12`, `X2`

### Game Period Markets

- **`h2h_q1`, `h2h_q2`, `h2h_q3`, `h2h_q4`** - Quarter/Half winners
- **`totals_q1`, `totals_q2`, etc.** - Quarter/Half totals
- **`spreads_q1`, `spreads_q2`, etc.** - Quarter/Half spreads

---

## Example Workflow - See ALL Market Types

### Quick Start (Recommended)

1. **Auto-fetch all markets for a sport:**
   ```bash
   # This will find an event and show ALL available markets
   node scripts/auto-fetch-all-markets.js americanfootball_nfl us
   ```
   This shows you EVERYTHING: match results, spreads, totals, player props, etc.

2. **Get event ID and fetch all markets:**
   ```bash
   # Step 1: Find an event
   node scripts/quick-inspect-event.js americanfootball_nfl
   
   # Step 2: Use the eventId to get ALL markets
   node scripts/fetch-all-markets.js <eventId> americanfootball_nfl us
   ```

### Detailed Workflow

1. **List available sports:**
   ```bash
   node scripts/list-sports.js
   ```
   Find the `sportKey` you want (e.g., `soccer_epl`, `basketball_nba`, `americanfootball_nfl`)

2. **Quick inspection (basic markets only):**
   ```bash
   node scripts/quick-inspect-event.js soccer_epl
   ```
   See basic markets (h2h, spreads, totals) - note the eventId

3. **Fetch ALL markets (including player props):**
   ```bash
   # Use eventId from step 2
   node scripts/fetch-all-markets.js <eventId> soccer_epl eu
   ```
   This shows ALL markets: featured, soccer-specific, player props, periods, etc.

4. **Or use auto-fetch (easiest):**
   ```bash
   node scripts/auto-fetch-all-markets.js soccer_epl eu
   ```
   Automatically finds event and fetches everything

---

## Player Props Structure

Player props have a different structure. Here's the example you showed:

```json
{
  "key": "player_pass_tds",
  "outcomes": [
    {
      "name": "Over",
      "description": "David Blough",  // Player name
      "price": -205,                  // American odds
      "point": 0.5                    // Line (0.5 touchdowns)
    },
    {
      "name": "Under",
      "description": "David Blough",
      "price": 150,
      "point": 0.5
    }
  ]
}
```

**Key differences:**
- `description` field contains the player name
- `point` field contains the line (e.g., 0.5 touchdowns, 250 yards)
- `name` is "Over" or "Under" for totals props
- `name` can be "Yes" or "No" for yes/no props (like "Anytime TD Scorer")

**To display player props:**
1. Group outcomes by `description` (player name)
2. Show the `point` (line) prominently
3. Display `price` (odds) for Over/Under options
4. For yes/no props, show both Yes and No options

## Response Structure

### Event Object Structure
```json
{
  "id": "event_id",
  "sport_key": "soccer_epl",
  "sport_title": "EPL",
  "commence_time": "2024-01-15T15:00:00Z",
  "home_team": "Team A",
  "away_team": "Team B",
  "bookmakers": [
    {
      "key": "bookmaker_key",
      "title": "Bookmaker Name",
      "last_update": "2024-01-15T14:00:00Z",
      "markets": [
        {
          "key": "h2h",
          "last_update": "2024-01-15T14:00:00Z",
          "outcomes": [
            {
              "name": "home",
              "price": 2.5
            },
            {
              "name": "away",
              "price": 3.0
            },
            {
              "name": "draw",
              "price": 2.8
            }
          ]
        }
      ]
    }
  ]
}
```

### Market Outcome Structure

**H2H (Match Winner):**
```json
{
  "name": "home" | "away" | "draw",
  "price": 2.5
}
```

**Spreads:**
```json
{
  "name": "home" | "away",
  "price": 1.9,
  "point": -1.5  // Handicap value
}
```

**Totals (Over/Under):**
```json
{
  "name": "over" | "under",
  "price": 1.85,
  "point": 2.5  // Total line
}
```

**BTTS (Both Teams to Score):**
```json
{
  "name": "Yes" | "No",
  "price": 1.75
}
```

**Player Props (Example: Pass Touchdowns):**
```json
{
  "name": "Over" | "Under",
  "description": "Player Name",  // e.g., "David Blough"
  "price": -205,                  // American odds
  "point": 0.5                    // Line value
}
```

**Player Props (Yes/No - Example: Anytime TD):**
```json
{
  "name": "Yes" | "No",
  "description": "Player Name",
  "price": 150
}
```

---

## Tips

1. **Start with Quick Inspection**: Use `quick-inspect-event.js` first to get a feel for available markets

2. **Check Multiple Bookmakers**: Different bookmakers may offer different markets. The scripts show the first bookmaker, but the saved JSON contains all bookmakers.

3. **Region Matters**: Some markets are only available in specific regions (e.g., US markets for US sports)

4. **Event-Specific Markets**: Additional markets like `btts`, `draw_no_bet` are only available via the `/events/{eventId}/odds` endpoint, not the `/sports/{sport}/odds` endpoint

5. **Save Responses**: All scripts save full API responses to `server/data/` for later analysis

---

## Troubleshooting

**"SPORTS_API_KEY not found"**
- Make sure `SPORTS_API_KEY` is set in `server/env` file
- Check that the file is named `env` (not `.env`)

**"No events found"**
- The sport might not have upcoming events
- Try a different sport or region
- Check if the sport key is correct (use `list-sports.js`)

**"API error 429"**
- You've hit the rate limit
- Wait a few minutes and try again
- Check your API plan limits

**"Some markets not available"**
- Not all markets are available for all sports
- Some markets require specific regions
- Additional markets require the `/events/{eventId}/odds` endpoint

---

## Next Steps

After inspecting the API responses:

1. **Update OddsAPIService**: Modify `server/src/services/OddsAPIService.js` to request additional markets
2. **Update Frontend Components**: Modify match display components to show different market types
3. **Update BettingContext**: Extend `BetSelection` type to support different market types
4. **Update SettlementService**: Add settlement logic for new market types (totals, spreads, etc.)
