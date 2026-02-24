import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import casinoApiService from './CasinoApiService.js';
import PointsService from './PointsService.js';

class CasinoService {
  /**
   * Launch a game for a user
   * @param {string} userId - User ID
   * @param {string} gameId - Game UUID from Slotegrator
   * @param {Object} options - Launch options
   * @returns {Promise<Object>} Launch URL and session info
   */
  async launchGame(userId, gameId, options = {}) {
    const {
      device = 'desktop', // 'desktop' or 'mobile'
      returnUrl = null,
      language = 'en',
    } = options;

    // Get user info
    const userResult = await db.query(
      'SELECT user_id, username, email, full_name FROM users WHERE user_id = ?',
      [userId]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get user profile for currency
    const profileResult = await db.query(
      'SELECT currency FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    const profile = profileResult.rows?.[0];
    const userCurrency = profile?.currency || process.env.CASINO_DEFAULT_CURRENCY || 'EUR';

    // Get user balance
    const pointsResult = await db.query(
      'SELECT current_balance FROM user_points WHERE user_id = ?',
      [userId]
    );

    const pointsRecord = pointsResult.rows?.[0];
    const totalBalance = pointsRecord?.current_balance || 0;

    // Get game details to check if it requires lobby
    const gamesResponse = await casinoApiService.getGames({ perPage: 100 });
    const game = gamesResponse.items?.find((g) => g.uuid === gameId);

    if (!game) {
      throw new Error('Game not found');
    }

    // Check provider enablement for user's currency
    const enabledProviders = await casinoApiService.getEnabledProviders(userCurrency);
    if (!enabledProviders.has(game.provider)) {
      throw new Error(`Provider ${game.provider} is not enabled for currency ${userCurrency}`);
    }

    // Handle lobby games: API may return lobby as array of tables or single object
    let lobbyData = null;
    if (game.has_lobby === 1) {
      const lobbyResponse = await casinoApiService.getGameLobby(gameId, userCurrency);
      const lobby = lobbyResponse.lobby;
      const firstTable = Array.isArray(lobby) ? lobby[0] : lobby;
      lobbyData = firstTable?.lobbyData ?? null;
      if (!lobbyData) {
        throw new Error('Failed to get lobby data for game');
      }
    }

    // Generate session ID
    const sessionId = uuidv4();

    // Initialize game session
    const initResponse = await casinoApiService.initializeGameSession({
      gameUuid: gameId,
      playerId: userId,
      playerName: user.username || user.full_name || `User_${userId}`,
      currency: userCurrency,
      sessionId: sessionId,
      device: device,
      returnUrl: returnUrl || process.env.CASINO_RETURN_URL || null,
      language: language,
      email: user.email || null,
      lobbyData: lobbyData,
    });

    if (!initResponse.url) {
      throw new Error('Failed to initialize game session');
    }

    // Store session in database
    const sessionRecordId = uuidv4();
    await db.query(
      `INSERT INTO game_sessions (
        id, user_id, game_id, session_token, started_at, initial_balance
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [sessionRecordId, userId, gameId, initResponse.sessionId || sessionId, totalBalance]
    );

    // Update recent games
    await db.query(
      `INSERT OR REPLACE INTO recent_games (id, user_id, game_id, last_played)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [uuidv4(), userId, gameId]
    );

    return {
      url: initResponse.url,
      sessionId: sessionId,
      gameId: gameId,
    };
  }

  /**
   * Process a casino transaction callback
   * @param {Object} callbackData - Callback data from Slotegrator
   * @returns {Promise<Object>} Response with balance and transaction_id
   */
  async processTransaction(callbackData) {
    const {
      action,
      player_id,
      transaction_id,
      session_id,
      game_uuid,
      amount,
      currency,
      round_id,
      bet_transaction_id,
      rollback_transactions,
      type,
    } = callbackData;

    // Check if transaction already processed (idempotency)
    const existingResult = await db.query(
      'SELECT id, status FROM casino_transactions WHERE transaction_id = ?',
      [transaction_id]
    );

    const existingTransaction = existingResult.rows?.[0];
    if (existingTransaction && existingTransaction.status === 'completed') {
      // Return existing balance
      const pointsResult = await db.query(
        'SELECT current_balance FROM user_points WHERE user_id = ?',
        [player_id]
      );
      
      const pointsRecord = pointsResult.rows?.[0];
      return {
        balance: pointsRecord?.current_balance || 0,
        transaction_id: transaction_id,
      };
    }

    // Get user balance
    const pointsResult = await db.query(
      'SELECT current_balance FROM user_points WHERE user_id = ?',
      [player_id]
    );

    const pointsRecord = pointsResult.rows?.[0];
    if (!pointsRecord) {
      throw new Error('User not found');
    }

    // Balance check: return immediately (no transaction, doc says response is only { balance })
    if (action === 'balance') {
      return { balance: pointsRecord.current_balance };
    }

    let newBalance = pointsRecord.current_balance;
    const transactionRecordId = uuidv4();

    try {
      // Process based on action type
      switch (action) {

        case 'bet':
          // Deduct points
          if (newBalance < amount) {
            return {
              error_code: 'INSUFFICIENT_FUNDS',
              error_description: 'Insufficient funds',
            };
          }

          await PointsService.deductPoints(
            player_id,
            amount,
            `Casino bet: ${game_uuid}`,
            null
          );

          newBalance -= amount;
          break;

        case 'win':
          // Credit points
          await PointsService.addPoints(
            player_id,
            amount,
            `Casino win: ${game_uuid}`,
            { transactionType: 'bet_won' }
          );

          newBalance += amount;
          break;

        case 'refund':
          // Refund original bet
          if (bet_transaction_id) {
            // Find original bet transaction
            const originalBetResult = await db.query(
              'SELECT amount FROM casino_transactions WHERE transaction_id = ? AND action = ?',
              [bet_transaction_id, 'bet']
            );
            const originalBet = originalBetResult.rows?.[0];

            if (originalBet) {
              await PointsService.addPoints(
                player_id,
                originalBet.amount,
                `Casino refund: ${game_uuid}`,
                { transactionType: 'refund' }
              );
              newBalance += originalBet.amount;
            } else {
              // Refund the amount provided
              await PointsService.addPoints(
                player_id,
                amount,
                `Casino refund: ${game_uuid}`,
                { transactionType: 'refund' }
              );
              newBalance += amount;
            }
          } else {
            await PointsService.addPoints(
              player_id,
              amount,
              `Casino refund: ${game_uuid}`,
              { transactionType: 'refund' }
            );
            newBalance += amount;
          }
          break;

        case 'rollback':
          // Rollback all transactions in the list
          if (rollback_transactions && Array.isArray(rollback_transactions)) {
            for (const rollbackTx of rollback_transactions) {
              if (rollbackTx.action === 'bet') {
                // Refund bet
                await PointsService.addPoints(
                  player_id,
                  rollbackTx.amount,
                  `Casino rollback: ${game_uuid}`,
                  { transactionType: 'refund' }
                );
                newBalance += rollbackTx.amount;
              } else if (rollbackTx.action === 'win') {
                // Deduct win
                await PointsService.deductPoints(
                  player_id,
                  rollbackTx.amount,
                  `Casino rollback: ${game_uuid}`,
                  null
                );
                newBalance -= rollbackTx.amount;
              } else if (rollbackTx.action === 'refund') {
                // Reverse refund (deduct)
                await PointsService.deductPoints(
                  player_id,
                  rollbackTx.amount,
                  `Casino rollback: ${game_uuid}`,
                  null
                );
                newBalance -= rollbackTx.amount;
              }
            }
          }
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Store transaction record
      await db.query(
        `INSERT INTO casino_transactions (
          id, user_id, session_id, transaction_id, game_uuid, action,
          amount, currency, round_id, bet_transaction_id, rollback_transactions,
          status, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)`,
        [
          transactionRecordId,
          player_id,
          session_id,
          transaction_id,
          game_uuid,
          action,
          amount,
          currency,
          round_id || null,
          bet_transaction_id || null,
          rollback_transactions ? JSON.stringify(rollback_transactions) : null,
        ]
      );

      // Update game session stats if session_id exists
      if (session_id) {
        const sessionResult = await db.query(
          'SELECT id FROM game_sessions WHERE session_token = ?',
          [session_id]
        );
        const session = sessionResult.rows?.[0];

        if (session) {
          if (action === 'bet') {
            await db.query(
              'UPDATE game_sessions SET total_bet = total_bet + ? WHERE id = ?',
              [amount, session.id]
            );
          } else if (action === 'win') {
            await db.query(
              'UPDATE game_sessions SET total_win = total_win + ? WHERE id = ?',
              [amount, session.id]
            );
          }
        }
      }

      // Get final balance
      const finalPointsResult = await db.query(
        'SELECT current_balance FROM user_points WHERE user_id = ?',
        [player_id]
      );
      const finalPointsRecord = finalPointsResult.rows?.[0];

      return {
        balance: finalPointsRecord?.current_balance || 0,
        transaction_id: transaction_id,
      };
    } catch (error) {
      // Mark transaction as failed
      await db.query(
        `UPDATE casino_transactions SET status = 'failed' WHERE id = ?`,
        [transactionRecordId]
      ).catch(() => {
        // If update fails, try to insert failed record
        db.query(
          `INSERT INTO casino_transactions (
            id, user_id, session_id, transaction_id, game_uuid, action,
            amount, currency, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'failed')`,
          [
            transactionRecordId,
            player_id,
            session_id,
            transaction_id,
            game_uuid,
            action,
            amount,
            currency,
          ]
        ).catch(() => {});
      });

      console.error('Error processing casino transaction:', error);
      return {
        error_code: 'INTERNAL_ERROR',
        error_description: error.message || 'Internal error processing transaction',
      };
    }
  }

  /**
   * Get user's recent games
   * @param {string} userId - User ID
   * @param {number} limit - Number of games to return
   * @returns {Promise<Array>} Recent games
   */
  async getUserRecentGames(userId, limit = 10) {
    const recentGamesResult = await db.query(
      `SELECT game_id, last_played FROM recent_games
       WHERE user_id = ?
       ORDER BY last_played DESC
       LIMIT ?`,
      [userId, limit]
    );

    return recentGamesResult.rows || [];
  }

  /**
   * Get user's game history
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Game history
   */
  async getUserGameHistory(userId, filters = {}) {
    const { limit = 50, gameId = null, action = null } = filters;

    let query = `SELECT * FROM casino_transactions WHERE user_id = ?`;
    const params = [userId];

    if (gameId) {
      query += ` AND game_uuid = ?`;
      params.push(gameId);
    }

    if (action) {
      query += ` AND action = ?`;
      params.push(action);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows || [];
  }

  /**
   * Update game session
   * @param {string} sessionId - Session token
   * @param {Object} data - Update data
   */
  async updateGameSession(sessionId, data) {
    const { endedAt = null, totalBet = null, totalWin = null, duration = null } = data;

    const updates = [];
    const params = [];

    if (endedAt !== null) {
      updates.push('ended_at = ?');
      params.push(endedAt);
    }

    if (totalBet !== null) {
      updates.push('total_bet = ?');
      params.push(totalBet);
    }

    if (totalWin !== null) {
      updates.push('total_win = ?');
      params.push(totalWin);
    }

    if (duration !== null) {
      updates.push('session_duration = ?');
      params.push(duration);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(sessionId);

    await db.query(
      `UPDATE game_sessions SET ${updates.join(', ')} WHERE session_token = ?`,
      params
    );
  }
}

export default new CasinoService();
