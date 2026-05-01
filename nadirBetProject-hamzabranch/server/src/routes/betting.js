import express from 'express';
import bettingService from '../services/BettingService.js';
import { authenticateToken, requireMinimumRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/betting/place
 * Place a bet for the authenticated user.
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
 * POST /api/betting/checkout
 * Validates the betslip selections against live APIs.
 */
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { selections } = req.body;
    const verification = await bettingService.verifyBetslip(selections);
    res.json(verification);
  } catch (error) {
    console.error('Error during checkout verification:', error);
    res.status(500).json({ error: 'Failed to verify betslip' });
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
