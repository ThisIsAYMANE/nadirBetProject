# API-AFL Testing Guide

## Overview
This guide helps you test the AFL (Australian Football League) API using Postman.

## Base URL
```
https://v1.afl.api-sports.io
```

## Authentication
All requests require the API key in the header:
- Header: `x-apisports-key`
- Value: `303e4402fcec0c684084b2b79a2b6338` (or your own key)

## Postman Collection
Import `postman-collection.json` to get started with pre-configured requests.

## Testing Phases

### Phase 1: Core Endpoints
Test foundational data first:
1. **Timezone** - Get available timezones
2. **Seasons** - Get available seasons
3. **Leagues** - Get all leagues
4. **Leagues by Season** - Filter leagues by season
5. **Leagues Current** - Get current active leagues

### Phase 2: Teams
Test team-related endpoints:
6. **Teams All** - Get all teams
7. **Teams by ID** - Get specific team
8. **Teams by League** - Get teams in a league
9. **Teams Search** - Search for teams
10. **Team Statistics** - Get team stats

### Phase 3: Games
Test game/fixture endpoints:
11. **Games by Date** - Get games on specific date
12. **Games by League** - Get games in a league
13. **Games by Team** - Get team's games
14. **Games H2H** - Head to head matchups
15. **Games Live** - Get live games

### Phase 4: Standings
16. **Standings** - League standings/table

### Phase 5: Players
17. **Players by Team** - Get team roster
18. **Players by ID** - Get player details
19. **Top Players** - Top performers

### Phase 6: Odds
20. **Odds** - Betting odds
21. **Live Odds** - Live betting odds

## Expected Responses

### Success (200)
```json
{
  "get": "endpoint",
  "parameters": [],
  "errors": [],
  "results": 1,
  "response": [...]
}
```

### Error (401)
```json
{
  "get": "",
  "errors": {
    "rateLimit": "Error/Missing application key..."
  },
  "results": 0,
  "response": []
}
```

## Testing Tips

1. **Start with Phase 1** - Core endpoints don't depend on others
2. **Check results count** - `results: 0` might mean no data for that filter
3. **Use current season** - 2023 has the most data
4. **Rate limits** - API has limits per minute; test slowly

## Common Parameters
- `season`: 4-digit year (2011-2023)
- `league`: League ID (e.g., 1 for AFL Premiership)
- `team`: Team ID
- `date`: YYYY-MM-DD format

## Support
- API Dashboard: https://dashboard.api-football.com/afl/ids
- Documentation: https://api-sports.io/documentation/afl/v1
