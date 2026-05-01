import express from 'express';
import apiSportsService from '../services/APISportsService.js';

const router = express.Router();

const SUPPORTED_SPORTS = [
  'football', 'afl', 'baseball', 'basketball',
  'formula-1', 'handball', 'hockey', 'mma',
  'nba', 'nfl', 'rugby', 'volleyball'
];

/**
 * GET /api/sports/config/available
 * Returns the list of supported sports and their data model info
 */
router.get('/config/available', (req, res) => {
  res.json({
    success: true,
    sports: SUPPORTED_SPORTS,
    notes: {
      football: 'Uses /fixtures endpoint (not /games)',
      mma: 'Uses /fights + /fighters (no /teams)',
      'formula-1': 'Uses /races + /drivers + /rankings (no /games)',
      others: 'All use /games, /teams, /players, /standings'
    }
  });
});

// ─── Simple in-memory cache to avoid 429 rate-limit errors ─────────────────
// TTL: 5 minutes for match data (300 000 ms)
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // key → { data, expiresAt }

function getCacheKey(sport, queryObj) {
  const sorted = Object.keys(queryObj).sort().map(k => `${k}=${queryObj[k]}`).join('&');
  return `${sport}::${sorted}`;
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setInCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/sports/:sport/matches
 * Fetches today's (or date-specific) matches using the correct endpoint per sport.
 * Query params: date (YYYY-MM-DD), league, season, live
 * Results are cached for 5 minutes per sport+date combo.
 */
router.get('/:sport/matches', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { date, league, season, live, timezone } = req.query;

    const params = {};
    if (date) params.date = date;
    // Only accept numeric league IDs — reject sport-slug strings (e.g. "football")
    if (league && /^\d+$/.test(league)) params.league = league;
    if (season) params.season = season;
    if (live) params.live = live;
    if (timezone) params.timezone = timezone;

    // Check cache first
    const cacheKey = getCacheKey(sport, params);
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log(`[Sports Cache] HIT ${cacheKey}`);
      return res.json({ success: true, sport, data: cached, cached: true });
    }

    const data = await apiSportsService.getMatches(sport, params);

    // Cache successful responses only
    if (!data.errors || (Array.isArray(data.errors) ? data.errors.length === 0 : Object.keys(data.errors).length === 0)) {
      setInCache(cacheKey, data);
    }

    res.json({ success: true, sport, data });
  } catch (error) {
    console.error(`[Sports Route] matches error:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/live
 * Fetches currently live matches.
 */
router.get('/:sport/live', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const data = await apiSportsService.getLiveMatches(sport, req.query);
    res.json({ success: true, sport, data });
  } catch (error) {
    console.error(`[Sports Route] live error:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/leagues
 */
router.get('/:sport/leagues', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const data = await apiSportsService.getLeagues(sport, req.query);
    res.json({ success: true, sport, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/teams
 * Works for all sports. For MMA returns /fighters. For F1 returns /teams (constructors).
 */
router.get('/:sport/teams', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const data = await apiSportsService.getTeams(sport, req.query);
    res.json({ success: true, sport, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/players
 * Works for all sports. For F1 + MMA returns /drivers and /fighters respectively.
 */
router.get('/:sport/players', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const data = await apiSportsService.getPlayers(sport, req.query);
    res.json({ success: true, sport, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/standings
 * Works for all sports. F1 returns driver rankings. MMA returns /rankings.
 */
router.get('/:sport/standings', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const data = await apiSportsService.getStandings(sport, req.query);
    res.json({ success: true, sport, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/statistics
 */
router.get('/:sport/statistics', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const data = await apiSportsService.getStatistics(sport, req.query);
    res.json({ success: true, sport, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * API-Sports bet-name → frontend market key mapping
 * These are the IDs returned by /odds/bets and used in the odds response
 */
const BET_NAME_TO_MARKET_KEY = {
  // Football / universal
  'Match Winner':                 'h2h',
  'Home/Away':                    'draw_no_bet',
  'Double Chance':                'double_chance',
  'Goals Over/Under':             'totals',
  'Both Teams Score':             'btts',
  'Result/Both Teams Score':      'result_btts',
  'Asian Handicap':               'spreads',
  'Correct Score':                'correct_score',
  'First Half Winner':            'h2h_1h',
  'Second Half Winner':           'h2h_2h',
  'HT/FT Double':                 'ht_ft',
  'Odd/Even':                     'odd_even',
  'Total - Home':                 'home_totals',
  'Total - Away':                 'away_totals',
  // Basketball / NBA / NFL
  'Winner':                       'h2h',
  'Point Spread':                 'spreads',
  'Total Points':                 'totals',
  'Over/Under':                   'totals',
  // MMA / Boxing
  'Method Of Victory':            'method',
  'Round Winner':                 'round_winner',
  // Rugby / Handball / Volleyball
  'Try Scorer':                   'try_scorer',
};

/**
 * Transform an API-Sports /odds response into our MatchMarket[] format.
 * Picks the best bookmaker (first one), converts each bet into a market.
 */
function transformOddsToMarkets(oddsData) {
  if (!oddsData || !oddsData.response || oddsData.response.length === 0) {
    return [];
  }

  const entry = oddsData.response[0]; // First fixture's odds
  const bookmakers = entry.bookmakers || entry.bookmaker || [];

  if (!bookmakers.length) return [];

  // Pick the first available bookmaker
  const bookmaker = bookmakers[0];
  const bets = bookmaker.bets || bookmaker.values || [];

  const markets = [];

  for (const bet of bets) {
    const betName = bet.name;
    const marketKey = BET_NAME_TO_MARKET_KEY[betName] || betName.toLowerCase().replace(/\s+/g, '_');

    const values = bet.values || [];
    if (!values.length) continue;

    const outcomes = values.map(v => ({
      name: v.value ?? v.name ?? '',
      price: parseFloat(v.odd ?? v.price ?? 1),
      // Extract line from names like "Over 2.5", "Under 2.5", "-1.5", "+1.5"
      line: extractLine(v.value ?? v.name ?? ''),
    })).filter(o => o.price > 1.0 && o.name !== ''); // Filter invalid odds

    if (outcomes.length === 0) continue;

    markets.push({
      key: marketKey,
      name: betName,
      bookmaker: bookmaker.name || 'API-Sports',
      outcomes,
    });
  }

  return markets;
}

/** Extract numeric line from strings like "Over 2.5", "Under 3", "-1.5", "+1" */
function extractLine(str) {
  if (!str) return undefined;
  const m = str.match(/([+-]?\d+(\.\d+)?)\s*$/);
  if (m) return parseFloat(m[1]);
  // "Over 2.5" / "Under 3.5"
  const m2 = str.match(/(?:over|under)\s+(\d+(\.\d+)?)/i);
  if (m2) return parseFloat(m2[1]);
  return undefined;
}

/**
 * GET /api/sports/:sport/odds/:matchId
 * Gets betting odds for a specific match/game/fixture and returns them as MatchMarket[].
 * Results are cached for 5 minutes.
 * Not available for Formula-1 or MMA (returns empty array).
 */
router.get('/:sport/odds/:matchId', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { matchId } = req.params;

    // Check cache
    const cacheKey = `odds::${sport}::${matchId}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, sport, matchId, markets: cached, cached: true });
    }

    const rawData = await apiSportsService.getOdds(sport, matchId, req.query);
    const markets = transformOddsToMarkets(rawData);

    setInCache(cacheKey, markets);
    res.json({ success: true, sport, matchId, markets });
  } catch (error) {
    console.error(`[Sports Route] odds error:`, error.message);
    res.status(500).json({ success: false, error: error.message, markets: [] });
  }
});

/**
 * GET /api/sports/:sport/odds-live/:matchId
 * Gets live odds for a specific match.
 */
router.get('/:sport/odds-live/:matchId', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { matchId } = req.params;
    const data = await apiSportsService.getLiveOdds(sport, matchId);
    res.json({ success: true, sport, matchId, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/predictions/:matchId
 * Gets AI predictions for a specific match.
 */
router.get('/:sport/predictions/:matchId', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { matchId } = req.params;
    const data = await apiSportsService.getPredictions(sport, matchId);
    res.json({ success: true, sport, matchId, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/match-stats/:matchId
 * Gets statistics for a specific match/fixture.
 */
router.get('/:sport/match-stats/:matchId', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { matchId } = req.params;
    const data = await apiSportsService.getMatchStatistics(sport, matchId, req.query);
    res.json({ success: true, sport, matchId, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/events/:matchId
 * Gets in-match events (goals, cards, KOs, etc.)
 */
router.get('/:sport/events/:matchId', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { matchId } = req.params;
    const data = await apiSportsService.getMatchEvents(sport, matchId);
    res.json({ success: true, sport, matchId, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/h2h
 * Head-to-head. Query: h2h=teamId1-teamId2
 */
router.get('/:sport/h2h', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const { h2h, league, season } = req.query;
    if (!h2h) {
      return res.status(400).json({ success: false, error: 'h2h param required (e.g. h2h=33-34)' });
    }
    const data = await apiSportsService.getH2H(sport, h2h, { league, season });
    res.json({ success: true, sport, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/:sport/status
 * Returns API quota usage for the given sport.
 */
router.get('/:sport/status', async (req, res) => {
  try {
    const sport = req.params.sport.toLowerCase();
    const data = await apiSportsService.getStatus(sport);
    res.json({ success: true, sport, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Formula-1 specific routes ──────────────────────────────────────────────

/**
 * GET /api/sports/formula-1/drivers
 */
router.get('/formula-1/drivers', async (req, res) => {
  try {
    const data = await apiSportsService.getDrivers(req.query.season || new Date().getFullYear());
    res.json({ success: true, sport: 'formula-1', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/formula-1/constructor-standings
 */
router.get('/formula-1/constructor-standings', async (req, res) => {
  try {
    const data = await apiSportsService.getConstructorStandings(req.query.season || new Date().getFullYear());
    res.json({ success: true, sport: 'formula-1', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── MMA specific routes ─────────────────────────────────────────────────────

/**
 * GET /api/sports/mma/events
 */
router.get('/mma/events', async (req, res) => {
  try {
    const data = await apiSportsService.getMMAEvents(req.query);
    res.json({ success: true, sport: 'mma', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sports/mma/rankings
 */
router.get('/mma/rankings', async (req, res) => {
  try {
    const data = await apiSportsService.getMMARankings(req.query);
    res.json({ success: true, sport: 'mma', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
