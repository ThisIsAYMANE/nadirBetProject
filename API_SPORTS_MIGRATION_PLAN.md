# API-Sports Migration Implementation Plan

## Overview

| Item | Value |
|------|-------|
| **Target API** | API-Sports (https://v3.football.api-sports.io) |
| **API Key** | `303e4402fcec0c684084b2b79a2b6338` |
| **Initial Sport** | Football (soccer) only |
| **Status** | Implemented - Testing phase |

---

## Changes Made

### Backend

1. **Created**: `server/src/services/APISportsProxyService.js`
   - Service to interact with API-Sports football API
   - Methods: getFixtures(), getLiveFixtures(), getFixtureDetails(), getLeagues(), getTeams(), getStandings()

2. **Updated**: `server/src/routes/sports.js`
   - Updated to use new APISportsProxyService
   - Routes changed from SportMonks to API-Sports

3. **Updated**: `server/.env`
   - Added `APISPORTS_API_KEY=303e4402fcec0c684084b2b79a2b6338`
   - Added `APISPORTS_BASE_URL=https://v3.football.api-sports.io`
   - Kept Odds API for settlement/scores

### Frontend

1. **Updated**: `nadir-user/hooks/useLiveOdds.ts`
   - Updated football fetch to use new `/api/sports/football/live`
   - Removed broken `/api/arbitrage` reference

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/sports/football/fixtures?date=YYYY-MM-DD` | Fixtures by date |
| `GET /api/sports/football/live` | Live matches |
| `GET /api/sports/football/fixtures/:id` | Match details |
| `GET /api/sports/football/leagues` | League list |
| `GET /api/sports/football/teams?league=X&season=YYYY` | Teams by league |
| `GET /api/sports/football/standings?league=X&season=YYYY` | Standings |
| `GET /api/sports/status` | API quota status |

---

## Testing

### Test the endpoint:
```bash
curl "http://localhost:3001/api/sports/football/fixtures?date=2026-04-10"
```

Expected response:
```json
{
  "success": true,
  "count": 45,
  "matches": [
    {
      "id": "16965485",
      "homeTeam": "Manchester United",
      "awayTeam": "Liverpool",
      "sport": "football",
      "league": "Premier League",
      "startTime": "2026-04-10T14:00:00Z",
      "status": "upcoming",
      "odds": { "home": 1.85, "draw": 3.50, "away": 4.20 }
    }
  ]
}
```

---

## To Do After Testing

1. **Verify UI displays odds correctly**
2. **Test placing a bet**
3. **Test bet history**
4. **Cleanup old files** (optional):
   - Delete `SportMonksProxyService.js`
   - Delete `SportMonksSyncService.js`
   - Delete `transformSportMonksOdds.js`

---

## Notes

- The Odds API is kept for settlement/scores (not changed)
- Only football is enabled for now - other sports can be added later
- API-Sports free trial has rate limits

---

## Implementation Date

Date: 2026-04-10