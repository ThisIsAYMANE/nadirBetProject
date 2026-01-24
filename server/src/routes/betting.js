import express from 'express';
import oddsAPIService from '../services/OddsAPIService.js';
import bettingService from '../services/BettingService.js';
import { authenticateToken, requireMinimumRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/betting/sports
 * List available sports/leagues from The Odds API.
 * Public: no auth required.
 */
router.get('/sports', async (req, res) => {
  try {
    const all = req.query.all === 'true';
    const sports = await oddsAPIService.getSports({ all });
    res.json(sports);
  } catch (error) {
    console.error('Error fetching sports from Odds API:', error);
    res.status(500).json({ error: 'Failed to fetch sports' });
  }
});

/**
 * GET /api/betting/event/:eventId/odds
 * Get odds for a specific event by eventId.
 * This endpoint supports additional markets (btts, draw_no_bet, etc.)
 * that are not available on /sports/{sportKey}/odds.
 * Public: no auth required (viewing odds only).
 *
 * Query params:
 *  - regions (optional, default: eu)
 *  - markets (optional, default: h2h)
 *  - oddsFormat (optional, default: decimal)
 */
router.get('/event/:eventId/odds', async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      regions,
      markets,
      oddsFormat,
      dateFormat,
    } = req.query;

    const options = {};
    if (regions) options.regions = regions;
    if (markets) options.markets = markets;
    if (oddsFormat) options.oddsFormat = oddsFormat;
    if (dateFormat) options.dateFormat = dateFormat;

    console.log(`[Event Odds] Fetching odds for event: ${eventId} with options:`, options);
    const odds = await oddsAPIService.getOddsForEvent(eventId, options);
    
    if (!odds) {
      return res.status(404).json({ 
        error: 'Event not found',
        eventId 
      });
    }

    res.json(odds);
  } catch (error) {
    console.error('Error fetching event odds from Odds API:', error);
    console.error('Error stack:', error.stack);
    console.error('Event ID:', req.params.eventId);
    console.error('Query params:', req.query);
    
    // Return more detailed error information
    const statusCode = error.status || 500;
    res.status(statusCode).json({ 
      error: 'Failed to fetch event odds',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      eventId: req.params.eventId,
      status: error.status
    });
  }
});

/**
 * GET /api/betting/odds/:sportKey
 * Get upcoming + live odds for a given sport.
 * Public: no auth required (viewing odds only).
 *
 * Query params:
 *  - regions (optional)
 *  - markets (optional)
 *  - oddsFormat (optional)
 */
router.get('/odds/:sportKey', async (req, res) => {
  try {
    const { sportKey } = req.params;
    const {
      regions,
      markets,
      oddsFormat,
      dateFormat,
      eventIds,
    } = req.query;

    const options = {};
    if (regions) options.regions = regions;
    if (markets) options.markets = markets;
    if (oddsFormat) options.oddsFormat = oddsFormat;
    if (dateFormat) options.dateFormat = dateFormat;
    if (eventIds) options.eventIds = String(eventIds).split(',');

    const odds = await oddsAPIService.getOddsForSport(sportKey, options);
    res.json(odds);
  } catch (error) {
    console.error('Error fetching odds from Odds API:', error);
    res.status(500).json({ error: 'Failed to fetch odds' });
  }
});

/**
 * GET /api/betting/scores/:sportKey
 * Get scores/live status for a sport (for monitoring/settlement).
 * Restricted to authenticated users (brokers/admins) for now.
 */
router.get('/scores/:sportKey', authenticateToken, async (req, res) => {
  try {
    const { sportKey } = req.params;
    const { daysFrom, dateFormat, eventIds } = req.query;

    const options = {};
    if (daysFrom) options.daysFrom = parseInt(daysFrom, 10) || 1;
    if (dateFormat) options.dateFormat = dateFormat;
    if (eventIds) options.eventIds = String(eventIds).split(',');

    const scores = await oddsAPIService.getScores(sportKey, options);
    res.json(scores);
  } catch (error) {
    console.error('Error fetching scores from Odds API:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

/**
 * POST /api/betting/place
 * Place a bet for the authenticated user.
 *
 * Expects body:
 *  {
 *    betType: 'single' | 'accumulator',
 *    stake: number,
 *    selections: [ ... ]
 *  }
 */
router.post('/place', authenticateToken, async (req, res) => {
  try {
    const result = await bettingService.placeBet(req.user, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(400).json({ error: error.message || 'Failed to place bet' });
  }
});

/**
 * GET /api/betting/my-bets
 * Get current user's bets (with optional status filter).
 */
router.get('/my-bets', authenticateToken, async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const bets = await bettingService.getUserBets(req.user.id, {
      status: status || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    res.json(bets);
  } catch (error) {
    console.error('Error fetching user bets:', error);
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

/**
 * GET /api/betting/bet/:betId
 * Get single bet with legs. User can only view own bets,
 * brokers/admins can see bets they manage.
 */
router.get('/bet/:betId', authenticateToken, async (req, res) => {
  try {
    const { betId } = req.params;
    const data = await bettingService.getBetWithLegs(betId);
    if (!data) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    // Simple ownership check: user must own bet unless they are at least broker
    const role = req.user.role;
    if (data.bet.user_id !== req.user.id && !['broker', 'admin', 'super_admin', 'owner', 'shop'].includes(role)) {
      return res.status(403).json({ error: 'Not authorized to view this bet' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching bet details:', error);
    res.status(500).json({ error: 'Failed to fetch bet details' });
  }
});

/**
 * GET /api/betting/monitor/bets
 * Monitoring endpoint for brokers/admins/owner to see bets for their users.
 */
router.get('/monitor/bets', authenticateToken, requireMinimumRole('broker'), async (req, res) => {
  try {
    const { status, sportKey, limit, offset } = req.query;
    const brokerId = req.user.id;

    const bets = await bettingService.getBetsForMonitoring({
      brokerId,
      status: status || undefined,
      sportKey: sportKey || undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    res.json(bets);
  } catch (error) {
    console.error('Error fetching monitored bets:', error);
    res.status(500).json({ error: 'Failed to fetch monitored bets' });
  }
});

export default router;

