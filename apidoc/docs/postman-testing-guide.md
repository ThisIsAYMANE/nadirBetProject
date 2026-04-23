# Postman Testing Guide for API-Sports SDKs

This guide walks you through testing all 12 sports APIs using Postman.

## Prerequisites

1. Download Postman: https://www.postman.com/downloads/
2. Install it and create a free account (optional)

---

## Quick Start: Import All Collections

### Method 1: Import via File

1. Open Postman
2. Click **Import** button (top-left)
3. Select **Upload Files**
4. Navigate to `C:\Users\AYMANE MAALI\OneDrive\Bureau\apidoc\`
5. Select all `*/postman-collection.json` files
6. Click **Import**

### Method 2: Import Each Sport Manually

For each sport folder, repeat:
1. Click **Import** → **Upload Files**
2. Select `sport/postman-collection.json`
3. Click **Import**

---

## Test Each Sport API

### 1. Football (Main API)

```bash
Base URL: https://v3.football.api-sports.io
```

1. Select "API-Football v3" collection in sidebar
2. Click **Phase 1: Core**
3. Click **1. Timezone** request
4. Click **Send** button (top-right)
5. Verify response shows timezone list

**Expected Response:**
```json
{
  "get": "timezone",
  "results": 425,
  "response": ["Africa/Abidjan", "Africa/Accra", ...]
}
```

---

### 2. Basketball

```bash
Base URL: https://v1.basketball.api-sports.io
```

1. Import `basketball/postman-collection.json`
2. Run Phase 1: Core → Timezone, Seasons, Countries, Leagues
3. Run Phase 2: Teams → Teams by ID, Teams by League
4. Run Phase 3: Games → Games by Date, Games by League
5. Run Phase 4: Standings

---

### 3. NBA

```bash
Base URL: https://v2.nba.api-sports.io
```

1. Import `nba/postman-collection.json`
2. Run phases in order

> ⚠️ **Note:** NBA uses v2 API (different base URL)

---

### 4. Baseball

```bash
Base URL: https://v1.baseball.api-sports.io
```

1. Import `baseball/postman-collection.json`
2. Run Phase 1: Core endpoints
3. Run Phase 2: Teams (includes Team Statistics)
4. Run Phase 3: Games (includes H2H)
5. Run Phase 4: Standings
6. Run Phase 5: Players (includes Top Scorers)

---

### 5. AFL

```bash
Base URL: https://v1.afl.api-sports.io
```

1. Import `afl/postman-collection.json`
2. Run through all phases

---

### 6. NFL

```bash
Base URL: https://v1.american-football.api-sports.io
```

1. Import `nfl/postman-collection.json`
2. Run Phase 1-6 in order

> ⚠️ **Note:** NFL uses `american-football.api-sports.io`

---

### 7. Handball

```bash
Base URL: https://v1.handball.api-sports.io
```

1. Import `handball/postman-collection.json`
2. Run Phase 1-4

---

### 8. Hockey

```bash
Base URL: https://v1.hockey.api-sports.io
```

1. Import `hockey/postman-collection.json`
2. Run Phase 1-4

---

### 9. MMA

```bash
Base URL: https://v1.mma.api-sports.io
```

1. Import `mma/postman-collection.json`
2. Run Phase 1: Core (Timezone, Seasons, Categories)
3. Run Phase 2: Fighters (includes Fighter Records)
4. Run Phase 3: Fights

---

### 10. Rugby

```bash
Base URL: https://v1.rugby.api-sports.io
```

1. Import `rugby/postman-collection.json`
2. Run Phase 1-4

---

### 11. Volleyball

```bash
Base URL: https://v1.volleyball.api-sports.io
```

1. Import `volleyball/postman-collection.json`
2. Run Phase 1-4

---

### 12. Formula-1

```bash
Base URL: https://v1.formula-1.api-sports.io
```

1. Import `formula1/postman-collection.json`
2. Run Phase 1: Core (Timezone, Seasons, Competitions, Circuits)
3. Run Phase 2: Teams & Drivers
4. Run Phase 3: Races
5. Run Phase 4: Rankings

---

### 13. Widgets

```bash
Base URL: https://widgets.api-sports.io/3.1.0
```

1. Import `widgets/postman-collection.json`
2. Widgets are HTML web components - they don't need traditional API testing
3. Test by creating an HTML file (see below)

---

## Test with Node.js (Alternative)

Each sport has a `test.js` file for quick testing:

```bash
# Test Football
cd C:\Users\AYMANE MAALI\OneDrive\Bureau\apidoc
node test.js

# Test Basketball
cd basketball
node test.js

# Test Baseball
cd baseball
node test.js

# Test each sport...
```

---

## Troubleshooting

### 401 Unauthorized Error

- Check API key is correct: `303e4402fcec0c684084b2b79a2b6338`
- Verify header name: `x-apisports-key`
- Check API subscription status at https://dashboard.api-football.com/

### 403 Forbidden Error

- API key may be blocked or expired
- Check dashboard for account status

### Rate Limiting

- Free plan: 100 requests/day
- You'll see rate limit headers:
  - `x-ratelimit-requests-remaining`
  - `X-RateLimit-Remaining`

### CORS Issues (for Widgets)

Widgets run in browser. Use this HTML test file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>API-Sports Widgets Test</title>
</head>
<body>
  <!-- Config -->
  <api-sports-widget
    data-type="config"
    data-key="303e4402fcec0c684084b2b79a2b6338"
    data-sport="football"
    data-lang="en"
    data-theme="dark"
  ></api-sports-widget>

  <!-- Games Widget -->
  <api-sports-widget 
    data-type="games"
    data-date="2024-01-01"
  ></api-sports-widget>

  <!-- Load Widget Script -->
  <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
</body>
</html>
```

Save as `test-widgets.html` and open in browser.

---

## Quick Reference: All Base URLs

| Sport | Base URL |
|-------|----------|
| Football | `https://v3.football.api-sports.io` |
| Basketball | `https://v1.basketball.api-sports.io` |
| NBA | `https://v2.nba.api-sports.io` |
| Baseball | `https://v1.baseball.api-sports.io` |
| AFL | `https://v1.afl.api-sports.io` |
| NFL | `https://v1.american-football.api-sports.io` |
| Handball | `https://v1.handball.api-sports.io` |
| Hockey | `https://v1.hockey.api-sports.io` |
| MMA | `https://v1.mma.api-sports.io` |
| Rugby | `https://v1.rugby.api-sports.io` |
| Volleyball | `https://v1.volleyball.api-sports.io` |
| Formula-1 | `https://v1.formula-1.api-sports.io` |
| Widgets | `https://widgets.api-sports.io/3.1.0` |

---

## API Key (All Collections)

```
x-apisports-key: 303e4402fcec0c684084b2b79a2b6338
```

---

## Next Steps

- Test each endpoint returns valid JSON
- Check response structure matches expected schema
- Verify `results` count > 0 for data endpoints
- Try different parameters (season, league, team IDs)
