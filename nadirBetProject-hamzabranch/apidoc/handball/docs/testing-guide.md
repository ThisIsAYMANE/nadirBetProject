# API-Handball Testing Guide

## Base URL
```
https://v1.handball.api-sports.io
```

## Authentication
Header: `x-apisports-key` = `303e4402fcec0c684084b2b79a2b6338`

## Testing Phases
1. **Core**: Timezone, Seasons, Countries, Leagues
2. **Teams**: Teams by ID/League
3. **Games**: Games by Date/League
4. **Standings**: League standings

## Key Parameters
- `season`: 2012-2022
- `league`: League ID
- `team`: Team ID
- `date`: YYYY-MM-DD

## Documentation
https://api-sports.io/documentation/handball/v1
