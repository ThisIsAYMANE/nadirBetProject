import express from 'express';
import casinoApiService from '../services/CasinoApiService.js';
import casinoService from '../services/CasinoService.js';
import { db } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateXSign } from '../services/CasinoApiService.js';

const router = express.Router();

/**
 * GET /api/casino/games
 * List games with filtering and pagination
 * Public: no auth required (for browsing)
 */
const SLOTEGRATOR_MAX_PER_PAGE = 50;

router.get('/games', async (req, res) => {
  try {
    const {
      page = 1,
      perPage = 50,
      expand = null,
      provider = null,
      type = null,
      device = null, // 'desktop' | 'mobile' – when set, fetch multiple Slotegrator pages until we have 50 matching (fills grid rows)
    } = req.query;

    const ourPage = Math.max(1, parseInt(page, 10));
    const targetPerPage = Math.min(parseInt(perPage, 10) || 50, 50);
    const options = { perPage: SLOTEGRATOR_MAX_PER_PAGE, expand: expand || undefined };

    const filterByDevice = (items, deviceType) => {
      if (!deviceType || !Array.isArray(items)) return items;
      const isMobile = String(deviceType).toLowerCase() === 'mobile';
      return items.filter((g) => (g.is_mobile === 1) === isMobile);
    };

    // When device is set, fetch multiple Slotegrator pages until we have enough matching games (so grid rows are full)
    if (device) {
      const skip = (ourPage - 1) * targetPerPage;
      let slotegratorPage = 1;
      const allMatching = [];
      const maxPages = 50; // safety limit

      while (allMatching.length < skip + targetPerPage && slotegratorPage <= maxPages) {
        const response = await casinoApiService.getGames({
          ...options,
          page: slotegratorPage,
        });
        let items = response.items || [];
        if (provider) items = items.filter((g) => g.provider === provider);
        if (type) items = items.filter((g) => g.type === type);
        items = filterByDevice(items, device);
        allMatching.push(...items);
        if (items.length === 0 && (response.items || []).length < SLOTEGRATOR_MAX_PER_PAGE) break;
        if ((response.items || []).length < SLOTEGRATOR_MAX_PER_PAGE) break;
        slotegratorPage++;
      }

      const games = allMatching.slice(skip, skip + targetPerPage);
      const hasMore = allMatching.length >= skip + targetPerPage;
      const pageCount = hasMore ? ourPage + 1 : ourPage;

      return res.json({
        items: games,
        _meta: {
          totalCount: allMatching.length,
          pageCount,
          currentPage: ourPage,
          perPage: targetPerPage,
        },
        _links: {},
      });
    }

    // Original single-request path (no device filter on backend)
    if (expand) options.expand = expand;
    const response = await casinoApiService.getGames({
      ...options,
      page: ourPage,
    });

    let games = response.items || [];
    if (provider) games = games.filter((g) => g.provider === provider);
    if (type) games = games.filter((g) => g.type === type);

    res.json({
      items: games,
      _meta: response._meta || {
        totalCount: games.length,
        pageCount: Math.ceil(games.length / targetPerPage) || 1,
        currentPage: ourPage,
        perPage: targetPerPage,
      },
      _links: response._links || {},
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch games',
    });
  }
});

/**
 * GET /api/casino/games/:gameId
 * Get game details
 * Public: no auth required
 */
router.get('/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { expand = null } = req.query;

    // Fetch games and find the specific one
    const response = await casinoApiService.getGames({
      perPage: 100,
      expand: expand,
    });

    const game = response.items?.find((g) => g.uuid === gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch game',
    });
  }
});

/**
 * POST /api/casino/games/:gameId/launch
 * Launch a game for authenticated user
 * Requires authentication
 */
router.post('/games/:gameId/launch', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { device = 'desktop', returnUrl = null, language = 'en' } = req.body;
    const userId = req.user.id;

    // Validate device
    if (device !== 'desktop' && device !== 'mobile') {
      return res.status(400).json({ error: 'Device must be "desktop" or "mobile"' });
    }

    // Launch game
    const launchResult = await casinoService.launchGame(userId, gameId, {
      device,
      returnUrl,
      language,
    });

    res.json({
      success: true,
      url: launchResult.url,
      sessionId: launchResult.sessionId,
      gameId: launchResult.gameId,
    });
  } catch (error) {
    console.error('Error launching game:', error);
    
    // Handle specific errors
    if (error.message.includes('not enabled')) {
      return res.status(403).json({
        error: 'Game not available',
        message: error.message,
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Game not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to launch game',
      message: error.message,
    });
  }
});

/**
 * GET /api/casino/providers
 * Get enabled providers for currencies
 * Public: no auth required
 */
router.get('/providers', async (req, res) => {
  try {
    const { currency = null } = req.query;

    if (currency) {
      // Get providers for specific currency
      const providers = await casinoApiService.getEnabledProviders(currency);
      res.json({
        currency,
        providers: Array.from(providers),
      });
    } else {
      // Get all limits (all currencies)
      const limits = await casinoApiService.getLimits();
      res.json(limits);
    }
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch providers',
    });
  }
});

/**
 * GET /api/casino/recent
 * Get user's recent games
 * Requires authentication
 */
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit || 10, 10);

    const recentGames = await casinoService.getUserRecentGames(userId, limit);

    res.json({
      success: true,
      games: recentGames,
    });
  } catch (error) {
    console.error('Error fetching recent games:', error);
    res.status(500).json({
      error: 'Failed to fetch recent games',
      message: error.message,
    });
  }
});

/**
 * GET /api/casino/history
 * Get user's game history
 * Requires authentication
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, gameId = null, action = null } = req.query;

    const history = await casinoService.getUserGameHistory(userId, {
      limit: parseInt(limit, 10),
      gameId: gameId || null,
      action: action || null,
    });

    res.json({
      success: true,
      transactions: history,
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({
      error: 'Failed to fetch game history',
      message: error.message,
    });
  }
});

/**
 * POST /api/casino/callback
 * Handle Slotegrator transaction callbacks
 * Public: no auth required (authenticated via X-Sign)
 */
router.post('/callback', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    // Validate X-Sign signature
    const merchantKey = process.env.CASINO_MERCHANT_KEY;
    if (!merchantKey) {
      console.error('CASINO_MERCHANT_KEY not configured');
      return res.status(500).json({
        error_code: 'INTERNAL_ERROR',
        error_description: 'Server configuration error',
      });
    }

    const headers = {
      'X-Merchant-Id': req.headers['x-merchant-id'],
      'X-Timestamp': req.headers['x-timestamp'],
      'X-Nonce': req.headers['x-nonce'],
      'X-Sign': req.headers['x-sign'],
    };

    // Verify all required headers present
    if (!headers['X-Merchant-Id'] || !headers['X-Timestamp'] || !headers['X-Nonce'] || !headers['X-Sign']) {
      return res.status(401).json({
        error_code: 'INTERNAL_ERROR',
        error_description: 'Missing authentication headers',
      });
    }

    // Calculate expected signature
    const expectedSign = calculateXSign(req.body, headers, merchantKey);

    // Verify signature
    if (expectedSign !== headers['X-Sign']) {
      console.error('Invalid X-Sign signature', {
        expected: expectedSign,
        received: headers['X-Sign'],
      });
      return res.status(401).json({
        error_code: 'INTERNAL_ERROR',
        error_description: 'Invalid signature',
      });
    }

    // Check timestamp (should be within 30 seconds)
    const timestamp = parseInt(headers['X-Timestamp'], 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 30) {
      return res.status(401).json({
        error_code: 'INTERNAL_ERROR',
        error_description: 'Request timestamp expired',
      });
    }

    // Process transaction
    const callbackData = {
      action: req.body.action,
      player_id: req.body.player_id,
      transaction_id: req.body.transaction_id,
      session_id: req.body.session_id,
      game_uuid: req.body.game_uuid,
      amount: parseFloat(req.body.amount) || 0,
      currency: req.body.currency,
      round_id: req.body.round_id || null,
      bet_transaction_id: req.body.bet_transaction_id || null,
      rollback_transactions: req.body.rollback_transactions
        ? JSON.parse(req.body.rollback_transactions)
        : null,
      type: req.body.type || null,
      freespin_id: req.body.freespin_id || null,
      quantity: req.body.quantity ? parseInt(req.body.quantity, 10) : null,
      finished: req.body.finished === 'true' || req.body.finished === true,
    };

    console.log('[Casino Callback]', {
      action: callbackData.action,
      player_id: callbackData.player_id,
      transaction_id: callbackData.transaction_id,
      amount: callbackData.amount,
    });

    const result = await casinoService.processTransaction(callbackData);

    // Return response (must be within 3 seconds)
    res.json(result);
  } catch (error) {
    console.error('Error processing casino callback:', error);
    res.status(500).json({
      error_code: 'INTERNAL_ERROR',
      error_description: error.message || 'Internal error processing transaction',
    });
  }
});

export default router;
