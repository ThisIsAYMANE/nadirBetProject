import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool, db } from '../database/db.js';
import pragmaticApiService from '../services/PragmaticApiService.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * GET /api/pragmatic/games
 * Get list of available games from Pragmatic Play
 * Requires authentication
 */
router.get('/games', authenticateToken, async (req, res) => {
  try {
    const games = await pragmaticApiService.getAvailableGames();
    
    res.json({
      success: true,
      games: games,
      count: games.length
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games',
      message: error.message
    });
  }
});

/**
 * POST /api/pragmatic/launch
 * Generate game launch URL for a player
 * Requires authentication
 */
router.post('/launch', [
  authenticateToken,
  body('gameId').notEmpty().withMessage('Game ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId, currency = 'USD', language = 'en', country = 'US', platform = 'WEB' } = req.body;
    const userId = req.user.id; // From JWT token

    // Get user info
    const userResult = await pool.query(
      'SELECT user_id, username, email FROM users WHERE user_id = ?',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate unique session token
    const token = crypto.randomBytes(32).toString('hex');
    
    // External player ID (can be user_id or formatted)
    const externalPlayerId = `player_${String(user.user_id).replace(/-/g, '')}`;

    // Calculate session expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store session in database
    await pool.query(
      `INSERT INTO pragmatic_sessions 
       (player_id, token, game_id, currency, status, expires_at, created_at) 
       VALUES (?, ?, ?, ?, 'active', ?, NOW())`,
      [user.user_id, token, gameId, currency, expiresAt]
    );

    // Get frontend URLs from environment or use defaults
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const cashierUrl = `${frontendUrl}/deposit`;
    const lobbyUrl = `${frontendUrl}/casino`;

    // Generate game URL
    const gameUrl = await pragmaticApiService.generateGameUrl({
      playerId: user.user_id,
      externalPlayerId: externalPlayerId,
      gameId: gameId,
      token: token,
      currency: currency,
      language: language,
      country: country,
      platform: platform,
      cashierUrl: cashierUrl,
      lobbyUrl: lobbyUrl
    });

    res.json({
      success: true,
      gameUrl: gameUrl,
      token: token,
      sessionId: token
    });
  } catch (error) {
    console.error('Error launching game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to launch game',
      message: error.message
    });
  }
});

/**
 * POST /api/pragmatic/authenticate
 * Webhook endpoint - Pragmatic calls this to authenticate a player
 * NO authentication required (Pragmatic calls this)
 */
router.post('/authenticate', async (req, res) => {
  try {
    const { token, providerId, hash } = req.body;

    // Validate hash
    const params = { token, providerId };
    if (!pragmaticApiService.validateHash(params, hash)) {
      return res.json({
        error: 5, // Invalid hash
        description: 'Invalid hash'
      });
    }

    // Find session by token
    const sessionResult = await pool.query(
      `SELECT ps.*, up.current_balance 
       FROM pragmatic_sessions ps
       LEFT JOIN user_points up ON ps.player_id = up.user_id
       WHERE ps.token = ? AND ps.status = 'active' AND ps.expires_at > NOW()`,
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.json({
        error: 4, // Invalid token
        description: 'Invalid or expired token'
      });
    }

    const session = sessionResult.rows[0];
    const balance = session.current_balance || 0;

    // Convert points to currency (assuming 1 point = 0.01 USD, adjust as needed)
    const cashBalance = (balance / 100).toFixed(2);

    res.json({
      userId: session.player_id,
      currency: session.currency || 'USD',
      cash: parseFloat(cashBalance),
      bonus: 0
    });
  } catch (error) {
    console.error('Error in authenticate webhook:', error);
    res.json({
      error: 100, // Temporary error
      description: 'Internal server error'
    });
  }
});

/**
 * POST /api/pragmatic/balance
 * Webhook endpoint - Pragmatic calls this to get player balance
 */
router.post('/balance', async (req, res) => {
  try {
    const { providerId, userId, hash } = req.body;

    // Validate hash
    const params = { providerId, userId };
    if (!pragmaticApiService.validateHash(params, hash)) {
      return res.json({
        error: 5, // Invalid hash
        description: 'Invalid hash'
      });
    }

    // Get user balance
    const balanceResult = await pool.query(
      'SELECT current_balance FROM user_points WHERE user_id = ?',
      [userId]
    );

    if (balanceResult.rows.length === 0) {
      return res.json({
        error: 2, // Player not found
        description: 'Player not found'
      });
    }

    const balance = balanceResult.rows[0].current_balance || 0;
    const cashBalance = (balance / 100).toFixed(2); // Convert points to currency

    res.json({
      currency: 'USD',
      cash: parseFloat(cashBalance),
      bonus: 0
    });
  } catch (error) {
    console.error('Error in balance webhook:', error);
    res.json({
      error: 100,
      description: 'Internal server error'
    });
  }
});

/**
 * POST /api/pragmatic/bet
 * Webhook endpoint - Pragmatic calls this when player places a bet
 */
router.post('/bet', async (req, res) => {
  try {
    const { userId, gameId, roundId, amount, reference, hash } = req.body;

    // Validate hash
    const params = { userId, gameId, roundId, amount, reference };
    if (!pragmaticApiService.validateHash(params, hash)) {
      return res.json({
        error: 5,
        description: 'Invalid hash'
      });
    }

    // Check if transaction already exists (idempotency)
    const existingTx = await pool.query(
      'SELECT * FROM pragmatic_transactions WHERE reference = ?',
      [reference]
    );

    if (existingTx.rows.length > 0) {
      // Return existing transaction balance
      const balanceResult = await pool.query(
        'SELECT current_balance FROM user_points WHERE user_id = ?',
        [userId]
      );
      const balance = balanceResult.rows[0]?.current_balance || 0;
      return res.json({
        balance: (balance / 100).toFixed(2),
        transactionId: existingTx.rows[0].id
      });
    }

    // Get current balance
    const balanceResult = await pool.query(
      'SELECT current_balance FROM user_points WHERE user_id = ?',
      [userId]
    );

    if (balanceResult.rows.length === 0) {
      return res.json({
        error: 2,
        description: 'Player not found'
      });
    }

    const currentBalance = balanceResult.rows[0].current_balance || 0;
    const betAmountPoints = Math.round(parseFloat(amount) * 100); // Convert currency to points

    // Check sufficient balance
    if (currentBalance < betAmountPoints) {
      return res.json({
        error: 1, // Insufficient balance
        description: 'Insufficient balance'
      });
    }

    // Deduct balance
    const newBalance = currentBalance - betAmountPoints;
    await pool.query(
      'UPDATE user_points SET current_balance = ? WHERE user_id = ?',
      [newBalance, userId]
    );

    // Create transaction record
    const txResult = await pool.query(
      `INSERT INTO pragmatic_transactions 
       (player_id, external_player_id, transaction_type, reference, round_id, game_id, amount, balance_before, balance_after, status, created_at)
       VALUES (?, ?, 'bet', ?, ?, ?, ?, ?, ?, 'completed', NOW())
       RETURNING id`,
      [userId, `player_${String(userId).replace(/-/g, '')}`, reference, roundId, gameId, betAmountPoints, currentBalance, newBalance]
    );

    res.json({
      balance: (newBalance / 100).toFixed(2),
      transactionId: txResult.rows[0].id
    });
  } catch (error) {
    console.error('Error in bet webhook:', error);
    res.json({
      error: 100,
      description: 'Internal server error'
    });
  }
});

/**
 * POST /api/pragmatic/result
 * Webhook endpoint - Pragmatic calls this when player wins
 */
router.post('/result', async (req, res) => {
  try {
    const { userId, gameId, roundId, amount, reference, hash } = req.body;

    // Validate hash
    const params = { userId, gameId, roundId, amount, reference };
    if (!pragmaticApiService.validateHash(params, hash)) {
      return res.json({
        error: 5,
        description: 'Invalid hash'
      });
    }

    // Check if transaction already exists (idempotency)
    const existingTx = await pool.query(
      'SELECT * FROM pragmatic_transactions WHERE reference = ?',
      [reference]
    );

    if (existingTx.rows.length > 0) {
      const balanceResult = await pool.query(
        'SELECT current_balance FROM user_points WHERE user_id = ?',
        [userId]
      );
      const balance = balanceResult.rows[0]?.current_balance || 0;
      return res.json({
        balance: (balance / 100).toFixed(2),
        transactionId: existingTx.rows[0].id
      });
    }

    // Get current balance
    const balanceResult = await pool.query(
      'SELECT current_balance FROM user_points WHERE user_id = ?',
      [userId]
    );

    if (balanceResult.rows.length === 0) {
      return res.json({
        error: 2,
        description: 'Player not found'
      });
    }

    const currentBalance = balanceResult.rows[0].current_balance || 0;
    const winAmountPoints = Math.round(parseFloat(amount) * 100);

    // Add win amount to balance
    const newBalance = currentBalance + winAmountPoints;
    await pool.query(
      'UPDATE user_points SET current_balance = ? WHERE user_id = ?',
      [newBalance, userId]
    );

    // Create transaction record
    const txResult = await pool.query(
      `INSERT INTO pragmatic_transactions 
       (player_id, external_player_id, transaction_type, reference, round_id, game_id, amount, balance_before, balance_after, status, created_at)
       VALUES (?, ?, 'win', ?, ?, ?, ?, ?, ?, 'completed', NOW())
       RETURNING id`,
      [userId, `player_${String(userId).replace(/-/g, '')}`, reference, roundId, gameId, winAmountPoints, currentBalance, newBalance]
    );

    res.json({
      balance: (newBalance / 100).toFixed(2),
      transactionId: txResult.rows[0].id
    });
  } catch (error) {
    console.error('Error in result webhook:', error);
    res.json({
      error: 100,
      description: 'Internal server error'
    });
  }
});

export default router;

