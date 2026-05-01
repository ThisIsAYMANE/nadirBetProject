# API-Football TypeScript SDK

A comprehensive TypeScript SDK for the API-Football (API-Sports) v3 API with full type safety, caching, and rate limit handling.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Add your API key:
```
API_KEY=your_api_key_here
```

## Quick Start

```typescript
import { ApiFootball } from './src';

const api = new ApiFootball({ apiKey: 'YOUR_KEY' });

// Fetch leagues
const leagues = await api.leagues.get({ country: 'England', season: 2023 });

// Fetch fixtures
const fixtures = await api.fixtures.get({ 
  league: 39, 
  season: 2023,
  from: '2024-01-01',
  to: '2024-01-31'
});

// Get team statistics
const stats = await api.teams.getStatistics({ 
  league: 39, 
  season: 2023, 
  team: 33 
});
```

## Caching

The SDK includes built-in caching with configurable TTL (default: 5 minutes).

```typescript
// Default - uses cache
const data = await api.leagues.get({ country: 'England' });

// Bypass cache
const data = await api.leagues.get({ country: 'England' }, { cache: false });

// Custom cache TTL (in seconds)
const api = new ApiFootball({ 
  apiKey: 'YOUR_KEY',
  cacheTTL: 600 // 10 minutes
});
```

## Rate Limiting

The SDK automatically handles rate limits by reading response headers:
- `X-RateLimit-Limit` - Max requests per minute
- `X-RateLimit-Remaining` - Remaining requests
- `x-ratelimit-requests-limit` - Daily limit
- `x-ratelimit-requests-remaining` - Daily remaining

## API Reference

### Core Endpoints

| Method | Description |
|--------|-------------|
| `timezone.get()` | Get list of available timezones |
| `countries.get(params)` | Get list of countries |

### Leagues

| Method | Description |
|--------|-------------|
| `leagues.get(params)` | Get leagues and cups |
| `leagues.getSeasons()` | Get available seasons |

### Teams

| Method | Description |
|--------|-------------|
| `teams.get(params)` | Get teams |
| `teams.getStatistics(params)` | Get team statistics |
| `teams.getSeasons(params)` | Get seasons for a team |
| `teams.getCountries()` | Get countries for teams |
| `venues.get(params)` | Get venues |

### Fixtures

| Method | Description |
|--------|-------------|
| `fixtures.get(params)` | Get fixtures |
| `fixtures.getRounds(params)` | Get rounds for a league |
| `fixtures.getHeadToHead(params)` | Get head to head |
| `fixtures.getStatistics(params)` | Get fixture statistics |
| `fixtures.getEvents(params)` | Get fixture events |
| `fixtures.getLineups(params)` | Get fixture lineups |
| `fixtures.getPlayers(params)` | Get fixture players |

### Standings

| Method | Description |
|--------|-------------|
| `standings.get(params)` | Get standings |

### Players

| Method | Description |
|--------|-------------|
| `players.get(params)` | Get players |
| `players.getSeasons(params)` | Get player seasons |
| `players.getProfiles(params)` | Get all player profiles |
| `players.getSquads(params)` | Get team squad |
| `players.getTeams(params)` | Get player career teams |
| `players.getTopScorers(params)` | Get top scorers |
| `players.getTopAssists(params)` | Get top assists |
| `players.getTopYellowCards(params)` | Get top yellow cards |
| `players.getTopRedCards(params)` | Get top red cards |

### Other Endpoints

| Method | Description |
|--------|-------------|
| `injuries.get(params)` | Get injuries |
| `predictions.get(params)` | Get predictions |
| `coachs.get(params)` | Get coaches |
| `transfers.get(params)` | Get transfers |
| `trophies.get(params)` | Get trophies |
| `sidelined.get(params)` | Get sidelined players/coaches |

### Odds

| Method | Description |
|--------|-------------|
| `odds.get(params)` | Get odds |
| `odds.getLive(params)` | Get live odds |
| `odds.getLiveBets(params)` | Get live odds bets |
| `odds.getMapping()` | Get odds mapping |
| `odds.getBookmakers()` | Get bookmakers |
| `odds.getBets()` | Get bet types |

## Examples

See the `examples/` folder for more usage examples.

## License

MIT