# API-NFL Testing Guide

## Base URL
```
https://v1.american-football.api-sports.io
```

## Authentication
Header: `x-apisports-key` = `303e4402fcec0c684084b2b79a2b6338`

## Testing Phases
1. **Core**: Timezone, Seasons, Leagues
2. **Teams**: Teams, Team Statistics
3. **Games**: Games by Date/League/Team, H2H
4. **Standings**: League standings
5. **Players**: Players, Top Scorers
6. **Injuries**: Injury reports

## Key Parameters
- `season`: 2010-2022
- `league`: 1 (NFL)
- `team`: Team ID
- `date`: YYYY-MM-DD

## Notes
- Covers both NFL and NCAA
- Season runs August-February

## Documentation
https://api-sports.io/documentation/nfl/v1
