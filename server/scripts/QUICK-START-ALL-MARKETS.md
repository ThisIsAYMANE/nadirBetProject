# Quick Start: See ALL Market Types (Including Player Props)

## 🚀 Fastest Way to See Everything

```bash
cd server

# For NFL (shows player props like pass TDs, rush yards, etc.)
node scripts/auto-fetch-all-markets.js americanfootball_nfl us

# For NBA (shows player props like points, rebounds, assists)
node scripts/auto-fetch-all-markets.js basketball_nba us

# For Soccer (shows btts, draw_no_bet, player goal scorer, etc.)
node scripts/auto-fetch-all-markets.js soccer_epl eu
```

This will:
1. ✅ Find the first available event
2. ✅ Fetch ALL market types (not just match results)
3. ✅ Show player props structure
4. ✅ Organize by category
5. ✅ Save full JSON response

---

## 📋 What You'll See

### Featured Markets
- `h2h` - Match Winner (Home/Away/Draw)
- `spreads` - Point Spreads / Handicaps
- `totals` - Over/Under Totals

### Soccer Markets (if soccer)
- `btts` - Both Teams to Score
- `draw_no_bet` - Draw No Bet
- `double_chance` - Double Chance
- `alternate_totals` - Alternate Over/Under lines
- `alternate_spreads` - Alternate Handicap lines

### Player Props (NFL Example)
- `player_pass_tds` - Pass Touchdowns (Over/Under)
- `player_pass_yds` - Pass Yards (Over/Under)
- `player_rush_yds` - Rush Yards (Over/Under)
- `player_receptions` - Receptions (Over/Under)
- `player_anytime_td` - Anytime Touchdown Scorer (Yes/No)
- `player_1st_td` - First Touchdown Scorer (Yes/No)
- ... and 20+ more player props

### Player Props Structure
```json
{
  "key": "player_pass_tds",
  "outcomes": [
    {
      "name": "Over",
      "description": "David Blough",  // Player name
      "price": -205,                  // American odds
      "point": 0.5                    // Line (0.5 TDs)
    },
    {
      "name": "Under",
      "description": "David Blough",
      "price": 150,
      "point": 0.5
    }
  ]
}
```

---

## 🔍 Step-by-Step: Get Specific Event Markets

If you want to inspect a specific event:

### Step 1: Find an Event
```bash
node scripts/quick-inspect-event.js americanfootball_nfl
```

Output will show:
```
✅ Found event: Atlanta Falcons vs Arizona Cardinals
   Event ID: a512a48a58c4329048174217b2cc7ce0
```

### Step 2: Fetch ALL Markets for That Event
```bash
node scripts/fetch-all-markets.js a512a48a58c4329048174217b2cc7ce0 americanfootball_nfl us
```

This will show:
- All featured markets
- All player props (organized by player)
- All period markets (quarters, halves)
- All alternate markets

---

## 📊 Understanding the Output

The script organizes markets into categories:

```
📁 Featured Markets (4)
  🔹 h2h
  🔹 spreads
  🔹 totals
  ...

📁 Player Props (25)
  🔹 player_pass_tds
     Sample Outcomes:
       • Over (David Blough) @ 0.5 - -205
       • Under (David Blough) @ 0.5 - 150
  🔹 player_rush_yds
  ...
```

---

## 💾 Saved Files

All responses are saved to `server/data/`:
- `all-markets-{timestamp}.json` - Complete analysis
- `event-markets-{timestamp}.json` - Full API response

Open these JSON files to see the exact structure you need to implement in your UI.

---

## 🎯 Next Steps for Implementation

After running the scripts, you'll have:

1. **Complete market list** - All available markets for each sport
2. **Market structures** - How each market type is structured
3. **Player props format** - How to display player-specific bets
4. **Sample outcomes** - Real examples from the API

Use this information to:
- Update your `OddsAPIService` to request additional markets
- Extend your `BetSelection` type to support different market types
- Update your UI components to display all market types
- Add player props sections to match details pages

---

## ⚠️ Important Notes

1. **Player props require event-specific endpoint**: Use `/events/{eventId}/odds`, not `/sports/{sport}/odds`

2. **Region matters**: Player props are mainly available in `us` region for US sports

3. **Not all markets available for all events**: Some events may not have all player props

4. **Odds format**: Player props often use American odds format, convert to decimal for display

5. **Market availability**: Different bookmakers offer different markets - check multiple bookmakers

---

## 🆘 Troubleshooting

**"No events found"**
- Try a different sport
- Try a different region
- Check if the sport has upcoming games

**"Some markets not available"**
- Normal - not all markets available for all events
- Try a different event
- Check if you're using the correct region

**"API error 400"**
- Some market combinations aren't supported
- The script handles this gracefully and continues

---

## 📚 Full Documentation

See `README-ODDS-API-INSPECTION.md` for complete documentation of all scripts.
