# Quick Setup Guide - Sportsbook API Integration

## 🚀 Getting Started

Your sports betting app is now powered by real-time data from the Sportsbook API! Here's how to get it running:

## Step 1: Environment Setup

Create a `.env.local` file in the root directory (if it doesn't exist):

```bash
# .env.local
NEXT_PUBLIC_RAPIDAPI_KEY=dd63db8b01mshd6d18807660bf17p1b8435jsnb348210fe82f
```

> **Note:** The API key above is already configured in your code. For production, get your own key from [RapidAPI](https://rapidapi.com/slothytech-slothytech-default/api/sportsbook-api2).

## Step 2: Install Dependencies (if needed)

```bash
npm install
# or
yarn install
```

## Step 3: Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Your app will be available at `http://localhost:3002`

## Step 4: Test the Integration

1. Navigate to any sports page (e.g., `/sports/football`)
2. You should see real data loading from the API
3. Try filtering by different leagues
4. Click the refresh button to reload data

## 🎯 What's Different Now?

### Before
- ❌ Static mock data
- ❌ Filters were just UI (no functionality)
- ❌ No real odds or matches

### After
- ✅ Real-time data from Sportsbook API
- ✅ Working league filters
- ✅ Live odds and match data
- ✅ Auto-refresh every 60 seconds
- ✅ Manual refresh button
- ✅ Error handling with fallbacks

## 📋 Available Pages

All these pages now use real API data:

- `/sports/football` - Soccer matches (Premier League, La Liga, etc.)
- `/sports/basketball` - NBA, EuroLeague, WNBA
- `/sports/american-football` - NFL, NCAA
- `/sports/tennis` - ATP, WTA
- `/sports/baseball` - MLB
- `/sports/ice-hockey` - NHL
- `/sports/boxing` - Boxing events
- `/sports/mma` - MMA fights
- `/sports/cricket` - Cricket matches
- `/sports/futsal` - Futsal matches
- `/sports/handball` - Handball matches
- `/sports/rugby` - Rugby matches
- `/sports/table-tennis` - Table tennis matches

## 🎨 Features You Can Try

### 1. League Filtering
Click on any league button to filter matches by that specific league:
- Example: On Football page, click "Premier League" to see only EPL matches

### 2. Manual Refresh
Click the refresh button to manually reload the latest odds

### 3. Responsive Design
Try resizing your browser or viewing on mobile - everything is responsive!

## 🔧 Troubleshooting

### Problem: No matches showing
**Solutions:**
1. Check if your API key is valid
2. Open browser console (F12) to see error messages
3. Verify you have internet connection
4. Some sports may not have active matches at certain times

### Problem: API Rate Limit Error
**Solutions:**
1. Wait a few minutes (free tier has rate limits)
2. Reduce refresh frequency
3. Consider upgrading your RapidAPI plan

### Problem: Page loads but shows "No matches available"
**Explanation:** This is normal! It means:
- The API is working correctly
- There are simply no upcoming matches for that sport/league at this time
- Try different sports or check back later

## 📊 API Endpoints

Your app now has these API endpoints:

```bash
# Get all matches for a sport
GET /api/sports/football

# Get matches for a specific league
GET /api/sports/football?league=soccer_epl

# Get arbitrage opportunities
GET /api/arbitrage?type=ARBITRAGE

# Get list of available sports
GET /api/sports
```

You can test these in your browser or with curl:

```bash
# Test football endpoint
curl http://localhost:3002/api/sports/football

# Test with specific league
curl http://localhost:3002/api/sports/basketball?league=basketball_nba
```

## 🎓 How It Works

### Architecture Overview

```
User Browser
    ↓
Sport Page (e.g., /sports/football)
    ↓
DynamicSportPage Component
    ↓
useSportsData Hook
    ↓
Next.js API Route (/api/sports/[sportKey])
    ↓
Sportsbook API Integration (lib/sportsbookApi.ts)
    ↓
RapidAPI Sportsbook API
    ↓
Real-time Sports Data
```

### Data Flow

1. User visits a sport page
2. `DynamicSportPage` component loads
3. `useSportsData` hook fetches data from your API route
4. API route calls Sportsbook API via RapidAPI
5. Data is transformed to match your app's format
6. Matches are displayed with odds
7. Auto-refresh happens every 60 seconds

## 🚀 Next Steps

Now that you have real data, you can:

1. **Add Bet Slip Functionality**
   - Allow users to add selections
   - Calculate potential returns
   - Place bets

2. **Implement User Accounts**
   - Save favorite teams/leagues
   - Track betting history
   - Manage balance

3. **Add More Features**
   - Live score updates
   - Odds comparison
   - Arbitrage calculator
   - Push notifications

4. **Optimize Performance**
   - Add more aggressive caching
   - Implement pagination
   - Add infinite scroll

## 📚 Documentation

For detailed technical documentation, see:
- `SPORTSBOOK_API_INTEGRATION.md` - Complete API integration guide
- `lib/sportsbookApi.ts` - API functions and utilities
- `components/sports/DynamicSportPage.tsx` - Main component code

## 🆘 Need Help?

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| TypeScript errors | Run `npm run typecheck` |
| Build errors | Run `npm run build` |
| Linting errors | Run `npm run lint` |
| Port already in use | Change port in `package.json` |
| API not responding | Check API key and internet connection |

## 🎉 You're All Set!

Your sports betting app is now powered by real-time data. Enjoy building!

---

**Pro Tip:** Keep the browser console open (F12) while developing to see API calls and any errors in real-time.

