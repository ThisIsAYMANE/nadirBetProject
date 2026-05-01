# API-MMA Testing Guide

## Base URL
```
https://v1.mma.api-sports.io
```

## Authentication
Header: `x-apisports-key` = `303e4402fcec0c684084b2b79a2b6338`

## Testing Phases
1. **Core**: Timezone, Seasons, Categories
2. **Fighters**: Fighters by ID/Team/Search, Fighter Records
3. **Fights**: Fights by Date/Fighter

## Key Parameters
- `season`: 2022-2023
- `fighter`: Fighter ID
- `date`: YYYY-MM-DD
- `search`: Search term

## Notes
- Different from team sports - focuses on fighters and fights
- Categories: weight classes (Featherweight, Lightweight, etc.)

## Documentation
https://api-sports.io/documentation/mma/v1
