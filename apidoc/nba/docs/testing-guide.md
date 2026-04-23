# API-NBA Testing Guide

## Base URL
```
https://v2.nba.api-sports.io
```

## Authentication
Header: `x-apisports-key` = `303e4402fcec0c684084b2b79a2b6338`

## Testing Phases

### Phase 1: Core
- **Seasons** - Available NBA seasons
- **Leagues** - Available leagues (Africa, Orlando, Sacramento, Standard, Utah, Vegas)

### Phase 2: Games
- Games by Date/ID/Season
- Game Statistics

### Phase 3: Teams
- Teams, Teams by ID, Teams by Season

### Phase 4: Players
- Players, Players by ID

## Key Parameters
- `season`: 2015-2021
- `league`: standard, africa, orlando, sacramento, utah, vegas
- `date`: YYYY-MM-DD
- `id`: Game/Team/Player ID

## Notes
- NBA uses v2 of the API (different from most sports)
- Season format: single year (2021, not 2021-2022)

## Documentation
https://api-sports.io/documentation/nba/v2
