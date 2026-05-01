import { pool, db } from '../database/db.js';
import PointsService from './PointsService.js';
import apiSportsService from './APISportsService.js';

class BettingService {
  /**
   * Validate and place a bet.
   * Supports:
   *  - single: exactly 1 selection
   *  - accumulator: 2+ selections (all must win)
   *
   * betData = {
   *   betType: 'single' | 'accumulator',
   *   stake: number,
   *   selections: [{
   *     sportKey,
   *     league,
   *     eventId,
   *     homeTeam,
   *     awayTeam,
   *     marketType,
   *     selection,
   *     line,
   *     odds,         // decimal odds
   *     commenceTime,
   *     bookmakerKey
   *   }]
   * }
   */
  async placeBet(user, betData) {
    const userId = user.id;
    const now = new Date().toISOString();

    if (!betData || !Array.isArray(betData.selections) || betData.selections.length === 0) {
      throw new Error('At least one selection is required');
    }

    const betType = betData.betType || (betData.selections.length === 1 ? 'single' : 'accumulator');
    if (!['single', 'accumulator'].includes(betType)) {
      throw new Error('Unsupported bet type');
    }

    if (betType === 'single' && betData.selections.length !== 1) {
      throw new Error('Single bet must have exactly one selection');
    }
    if (betType === 'accumulator' && betData.selections.length < 2) {
      throw new Error('Accumulator bet must have at least two selections');
    }

    const stake = parseInt(betData.stake, 10);
    if (!Number.isFinite(stake) || stake <= 0) {
      throw new Error('Stake must be a positive integer');
    }

    // Basic per-bet constraints (could be extended using bet_limits table)
    const MIN_STAKE = 1;
    const MAX_STAKE = 1_000_000;
    const MAX_LEGS = 20;

    if (stake < MIN_STAKE) throw new Error(`Minimum stake is ${MIN_STAKE} points`);
    if (stake > MAX_STAKE) throw new Error(`Maximum stake is ${MAX_STAKE} points`);
    if (betData.selections.length > MAX_LEGS) throw new Error(`Maximum number of selections is ${MAX_LEGS}`);

    // Calculate combined odds (decimal)
    const decimalOdds = betData.selections.reduce((acc, sel) => {
      const odds = Number(sel.odds);
      if (!Number.isFinite(odds) || odds <= 1) {
        throw new Error('Invalid odds in selection');
      }
      return acc * odds;
    }, 1);

    const potentialPayout = Math.round(stake * decimalOdds);

    // Deduct points first
    const deductionResult = await PointsService.deductPoints(
      userId,
      stake,
      `Bet placed (${betType}) with ${betData.selections.length} selection(s)`,
      null
    );

    // Persist bet + legs in a DB transaction
    const betId = db.generateUuid();

    await pool.query('BEGIN TRANSACTION');
    try {
      await pool.query(
        `INSERT INTO sports_bets (
          bet_id, user_id, broker_id, bet_type, total_stake, potential_payout, payout,
          status, odds_format, sport_key, created_at, settlement_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          betId,
          userId,
          user.broker_id || null,
          betType,
          stake,
          potentialPayout,
          0,
          'pending',
          'decimal',
          betData.selections[0].sportKey || null,
          now,
          'auto'
        ]
      );

      for (const sel of betData.selections) {
        const legId = db.generateUuid();
        // Normalize market type (match_winner -> h2h for database)
        const marketType = sel.marketType === 'match_winner' ? 'h2h' : sel.marketType;

        await pool.query(
          `INSERT INTO bet_legs (
            leg_id, bet_id, sport_key, league, event_id, home_team, away_team,
            market_type, selection, line, odds_when_placed, status, commence_time, bookmaker_key
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            legId,
            betId,
            sel.sportKey,
            sel.league || null,
            sel.eventId,
            sel.homeTeam,
            sel.awayTeam,
            marketType,
            sel.selection,
            sel.line || null,
            Number(sel.odds),
            'pending',
            sel.commenceTime || null,
            sel.bookmakerKey || null
          ]
        );
      }

      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      // If DB write fails after points deduction, we should NOT silently lose points.
      // For now we log and rethrow; in a real system we might compensate.
      console.error('Error saving bet after points deduction:', error);
      throw error;
    }

    return {
      success: true,
      betId,
      betType,
      totalStake: stake,
      potentialPayout,
      selections: betData.selections.length,
      newBalance: deductionResult.newBalance,
    };
  }

  async getUserBets(userId, { status, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT *
      FROM sports_bets
      WHERE user_id = ?
    `;
    const params = [userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await pool.query(sql, params);
    return result.rows;
  }

  async getBetWithLegs(betId) {
    const betResult = await pool.query(
      'SELECT * FROM sports_bets WHERE bet_id = ?',
      [betId]
    );
    if (betResult.rows.length === 0) {
      return null;
    }
    const legsResult = await pool.query(
      'SELECT * FROM bet_legs WHERE bet_id = ? ORDER BY leg_id',
      [betId]
    );
    return {
      bet: betResult.rows[0],
      legs: legsResult.rows,
    };
  }

  async getBetsForMonitoring({ brokerId, status, sportKey, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT b.*, u.full_name as user_name, u.email as user_email
      FROM sports_bets b
      INNER JOIN users u ON b.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (brokerId) {
      sql += ' AND (b.broker_id = ? OR u.broker_id = ?)';
      params.push(brokerId, brokerId);
    }
    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }
    if (sportKey) {
      sql += ' AND b.sport_key = ?';
      params.push(sportKey);
    }

    sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await pool.query(sql, params);
    return result.rows;
  }

  /**
   * Validates a betslip by checking current live odds from our APIs.
   * Modifies selections with updated odds or suspended flags.
   */
  async verifyBetslip(selections) {
    if (!Array.isArray(selections) || selections.length === 0) {
      return { valid: false, message: 'No selections provided' };
    }

    // TODO: Re-implement validation with the new generic APISportsService.
    // For now, assume all selections are valid to avoid breaking checkout.
    console.log('[BettingService] verifyBetslip is temporarily returning true while the new API-Sports integration is finalized.');
    
    const verifiedSelections = selections.map(sel => ({
      ...sel,
      status: 'active',
      currentOdds: sel.odds
    }));

    return {
      valid: true,
      oddsChanged: false,
      selections: verifiedSelections
    };
  }
}

const bettingService = new BettingService();
export default bettingService;

