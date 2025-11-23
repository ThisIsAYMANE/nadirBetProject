# Sportsbook API Integration Documentation

## Overview

This project now integrates with the **Sportsbook API** via RapidAPI to fetch real-time sports betting data. All sports pages are now dynamic and use live data from the API with working filtering functionality.

## What Was Implemented

### 1. **API Integration Layer** (`lib/sportsbookApi.ts`)
- Complete integration with Sportsbook API
- Functions to fetch:
  - Arbitrage opportunities
  - Odds for specific sports
  - Multiple sports/leagues at once
  - Available sports list
- Automatic data transformation to match existing `Match` interface
- Support for multiple markets (h2h, spreads, totals)
- Smart caching with 60-second revalidation

### 2. **Next.js API Routes** (`app/api/`)
- `/api/sports` - Get list of all available sports
- `/api/sports/[sportKey]` - Get matches for a specific sport with optional league filtering
- `/api/arbitrage` - Get arbitrage betting opportunities

### 3. **Custom React Hook** (`hooks/useSportsData.ts`)
- `useSportsData(sportKey, selectedLeague)` hook
- Automatic data fetching and state management
- Error handling and loading states
- Refetch capability for manual refresh

### 4. **Dynamic Sport Page Component** (`components/sports/DynamicSportPage.tsx`)
- Reusable component for all sport pages
- Integrated filtering by league/competition
- Refresh button for manual data updates
- Error handling with user-friendly messages
- Loading states and skeleton screens
- Responsive design for all screen sizes

### 5. **Sport Configurations** (`lib/sportConfigs.ts`)
- Centralized configuration for all sports
- Defines leagues, colors, icons, and descriptions
- Easy to extend with new sports

### 6. **Updated All Sport Pages**
All sport pages now use the dynamic component:
- ⚽ Football (Soccer)
- 🏀 Basketball
- 🏈 American Football
- 🎾 Tennis
- ⚾ Baseball
- 🏒 Ice Hockey
- 🥊 Boxing
- 🥋 MMA
- 🏏 Cricket
- ⚽ Futsal
- 🤾 Handball
- 🏉 Rugby
- 🏓 Table Tennis

## Features

### ✅ Dynamic Data Loading
- Real-time odds from Sportsbook API
- Automatic refresh every 60 seconds
- Manual refresh button

### ✅ Smart Filtering
- Filter by league/competition
- "All Leagues" option to see everything
- URL-based filtering (can be extended)
- Preserves filter state during refresh

### ✅ Error Handling
- Graceful fallbacks on API errors
- User-friendly error messages
- Retry functionality

### ✅ Performance
- API route caching
- Optimized data fetching
- Skeleton loading states

### ✅ Responsive Design
- Mobile-first approach
- Touch-friendly buttons (44px min height)
- Horizontal scrolling for filter buttons
- Adaptive grid layouts

## Usage

### Basic Usage

Each sport page now automatically fetches and displays live data:

```typescript
import DynamicSportPage from '@/components/sports/DynamicSportPage';
import { getSportConfig } from '@/lib/sportConfigs';

export default function FootballPage() {
  return <DynamicSportPage config={getSportConfig('football')} />;
}
```

### Fetching Data Programmatically

Use the `useSportsData` hook in any component:

```typescript
import { useSportsData } from '@/hooks/useSportsData';

function MyComponent() {
  const { matches, isLoading, error, refetch } = useSportsData('football', 'soccer_epl');
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Direct API Calls

You can also fetch from API routes directly:

```typescript
// Fetch all football matches
const response = await fetch('/api/sports/football');
const data = await response.json();

// Fetch specific league
const response = await fetch('/api/sports/football?league=soccer_epl');
const data = await response.json();

// Fetch arbitrage opportunities
const response = await fetch('/api/arbitrage?type=ARBITRAGE');
const data = await response.json();
```

## API Configuration

### Environment Variables

Add your RapidAPI key to `.env.local`:

```bash
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here
```

The default key is already set in the code, but you should update it with your own key for production.

### Available Sport Keys

The API uses specific keys for each sport/league:

**Football (Soccer):**
- `soccer_epl` - Premier League
- `soccer_spain_la_liga` - La Liga
- `soccer_germany_bundesliga` - Bundesliga
- `soccer_italy_serie_a` - Serie A
- `soccer_uefa_champs_league` - Champions League

**Basketball:**
- `basketball_nba` - NBA
- `basketball_euroleague` - EuroLeague
- `basketball_wnba` - WNBA

**American Football:**
- `americanfootball_nfl` - NFL
- `americanfootball_ncaaf` - NCAA

**Tennis:**
- `tennis_atp` - ATP
- `tennis_wta` - WTA

And more... (See `lib/sportsbookApi.ts` for complete list)

## Adding a New Sport

To add a new sport:

1. **Add configuration** in `lib/sportConfigs.ts`:
```typescript
'volleyball': {
  key: 'volleyball',
  name: 'Volleyball',
  icon: '🏐',
  description: 'International Volleyball',
  color: 'bg-blue-600',
  leagues: [
    { key: 'volleyball_pro', label: 'Pro League' }
  ]
}
```

2. **Create page** at `app/sports/volleyball/page.tsx`:
```typescript
import DynamicSportPage from '@/components/sports/DynamicSportPage';
import { getSportConfig } from '@/lib/sportConfigs';

export default function VolleyballPage() {
  return <DynamicSportPage config={getSportConfig('volleyball')} />;
}
```

3. **Update sport leagues** in `lib/sportsbookApi.ts`:
```typescript
export const SPORT_LEAGUES: Record<string, string[]> = {
  // ... existing sports
  'volleyball': ['volleyball_pro', 'volleyball_fivb'],
};
```

That's it! The new sport page will automatically use the dynamic component with full filtering support.

## API Response Structure

### Match Data
```typescript
{
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  startTime: string; // ISO 8601 format
  status: 'upcoming' | 'live' | 'finished';
  odds: {
    home: number;
    draw?: number;  // Only for sports like football
    away: number;
  };
  homeScore?: number;  // For live matches
  awayScore?: number;  // For live matches
}
```

### API Route Response
```typescript
{
  success: boolean;
  sport: string;
  count: number;
  matches: Match[];
  error?: string;  // Only on error
}
```

## Customization

### Modify Caching Strategy

Edit `lib/sportsbookApi.ts`:
```typescript
const getFetchOptions = (method: string = 'GET'): RequestInit => ({
  method,
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
  },
  next: { revalidate: 30 } // Change to 30 seconds
});
```

### Change Default Markets

Edit the API route `app/api/sports/[sportKey]/route.ts`:
```typescript
const markets = searchParams.get('markets') || 'h2h'; // Only fetch h2h odds
```

### Customize Filter Labels

Edit `lib/sportConfigs.ts` and change the league labels:
```typescript
leagues: [
  { key: 'soccer_epl', label: 'English Premier League' }, // More descriptive
]
```

## Troubleshooting

### No Data Showing
1. Check API key is valid in `.env.local`
2. Check browser console for errors
3. Verify RapidAPI subscription is active
4. Check API rate limits

### Filtering Not Working
1. Ensure league keys match those in `sportConfigs.ts`
2. Check API route is receiving correct parameters
3. Verify the API supports the requested league

### Slow Loading
1. Reduce number of leagues fetched simultaneously
2. Adjust cache revalidation time
3. Consider implementing pagination

## API Limitations

- **Rate Limits:** Check your RapidAPI plan for rate limits
- **Sports Coverage:** Not all sports/leagues may be available
- **Data Freshness:** Odds update frequency depends on API
- **Historical Data:** Limited access to past matches

## Next Steps

Potential enhancements:

1. **WebSocket Integration** - Real-time odds updates
2. **Bet Slip** - Add matches to betting slip
3. **Odds Comparison** - Compare odds across bookmakers
4. **Arbitrage Calculator** - Calculate arbitrage opportunities
5. **Historical Odds** - Track odds movements
6. **Push Notifications** - Alert on odds changes
7. **User Preferences** - Save favorite leagues/teams
8. **Advanced Filters** - Filter by date, odds range, etc.

## Support

For issues with:
- **API Integration:** Check Sportsbook API documentation on RapidAPI
- **Component Bugs:** Review component code in `components/sports/`
- **Data Issues:** Check API routes in `app/api/sports/`

## Credits

- **Sportsbook API:** [RapidAPI Sportsbook API](https://rapidapi.com/slothytech-slothytech-default/api/sportsbook-api2)
- **Next.js:** React framework for production
- **TailwindCSS:** Utility-first CSS framework

