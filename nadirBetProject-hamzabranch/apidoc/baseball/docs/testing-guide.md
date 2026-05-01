# API-Baseball Testing Guide

## Base URL
```
https://v1.baseball.api-sports.io
```

## Authentication
Header: `x-apisports-key` = `303e4402fcec0c684084b2b79a2b6338`

## Testing Phases

### Phase 1: Core
- Timezone, Seasons, Countries, Leagues

### Phase 2: Teams
- Teams by ID/League, Team Statistics

### Phase 3: Games
- Games by Date/League/Team, H2H

### Phase 4: Standings
- League standings

### Phase 5: Players
- Players by Team/ID

### Phase 6: Odds
- Odds, Live Odds

## Key Parameters
- `season`: 2015-2020
- `league`: League ID (e.g., 1 for MLB)
- `team`: Team ID
- `date`: YYYY-MM-DD

## Documentation
https://api-sports.io/documentation/baseball/v1
