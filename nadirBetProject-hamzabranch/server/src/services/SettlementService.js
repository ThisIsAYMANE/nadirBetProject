import { pool, db } from '../database/db.js';
import apiSportsService from './APISportsService.js';
import PointsService from './PointsService.js';

class SettlementService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Run one full settlement cycle for all sports that have pending bets.
   */
  async runSettlementCycle() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;

    try {
      const result = await pool.query(
        `
        SELECT DISTINCT bl.sport_key
        FROM bet_legs bl
        INNER JOIN sports_bets b ON bl.bet_id = b.bet_id
        WHERE bl.status = 'pending'
          AND b.status = 'pending'
          AND bl.sport_key IS NOT NULL
        `
      );

      const sportKeys = result.rows.map((row) => row.sport_key);
      if (sportKeys.length === 0) {
        return;
      }

      for (const sportKey of sportKeys) {
        try {
          await this.settleSportBets(sportKey);
        } catch (err) {
          console.error(`Error settling bets for sport ${sportKey}:`, err);
        }
      }
    } catch (error) {
      console.error('Settlement cycle error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async settleSportBets(sportKey) {
    // TODO: Implement settlement logic using apiSportsService for the new sports
    // The previous implementation relied on oddsAPIService which has been removed.
    console.log(`[SettlementService] Settlement for sport ${sportKey} is currently pending implementation with the new API-Sports.`);
    return;
  }

  /**
   * Decide leg status based on game scores.
   */
  decideLegStatus(leg, game) {
    if (!game || !game.completed) {
      return 'pending';
    }
    if (!game.scores || game.scores.length < 2) {
      return 'pending';
    }

    const homeName = game.home_team;
    const awayName = game.away_team;

    const homeScoreEntry = game.scores.find((s) => s.name === homeName);
    const awayScoreEntry = game.scores.find((s) => s.name === awayName);

    if (!homeScoreEntry || !awayScoreEntry) {
      return 'pending';
    }

    const homeScore = parseInt(homeScoreEntry.score, 10);
    const awayScore = parseInt(awayScoreEntry.score, 10);

    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
      return 'pending';
    }

    // Only basic match-winner logic for now
    if (homeScore > awayScore) {
      if (leg.selection === 'home') return 'won';
      if (leg.selection === 'away' || leg.selection === 'draw') return 'lost';
    } else if (awayScore > homeScore) {
      if (leg.selection === 'away') return 'won';
      if (leg.selection === 'home' || leg.selection === 'draw') return 'lost';
    } else {
      // Draw
      if (leg.selection === 'draw') return 'won';
      // For now, treat non-draw selections in an exact draw as void (stake returned)
      return 'void';
    }

    return 'lost';
  }

  calculateAccumulatorPayout(stake, legs) {
    const winningLegs = legs.filter((l) => l.status === 'won');
    if (winningLegs.length === 0) {
      return 0;
    }

    const combinedOdds = winningLegs.reduce(
      (acc, leg) => acc * Number(leg.odds_when_placed),
      1
    );

    if (!Number.isFinite(combinedOdds) || combinedOdds <= 1) {
      return stake;
    }

    return Math.round(stake * combinedOdds);
  }

  async settleSingleBet(bet, legs, scoresByEventId) {
    // Determine leg statuses
    const updatedLegs = [];
    for (const leg of legs) {
      const game = scoresByEventId.get(leg.event_id);
      const newStatus = this.decideLegStatus(leg, game);
      if (newStatus !== 'pending' && newStatus !== leg.leg_status) {
        updatedLegs.push({ leg_id: leg.leg_id, status: newStatus });
      }
    }

    if (updatedLegs.length === 0) {
      // Nothing to update for this bet yet
      return;
    }

    // Apply leg updates
    await pool.query('BEGIN TRANSACTION');
    try {
      const now = db.getCurrentTimestamp();
      for (const leg of updatedLegs) {
        await pool.query(
          `UPDATE bet_legs
           SET status = ?, result_fetched_at = ?
           WHERE leg_id = ?`,
          [leg.status, now, leg.leg_id]
        );
      }

      // Re-fetch all legs for this bet to decide final bet status
      const legsResult = await pool.query(
        'SELECT status, odds_when_placed FROM bet_legs WHERE bet_id = ?',
        [bet.bet_id]
      );
      const allLegs = legsResult.rows;

      const anyPending = allLegs.some((l) => l.status === 'pending');
      const anyLost = allLegs.some((l) => l.status === 'lost');
      const anyWon = allLegs.some((l) => l.status === 'won');
      const allVoid = allLegs.every((l) => l.status === 'void');

      if (anyPending) {
        await pool.query('COMMIT');
        return;
      }

      let finalStatus = 'lost';
      let payout = 0;

      if (allVoid) {
        finalStatus = 'void';
        payout = bet.total_stake;
      } else if (anyLost) {
        finalStatus = 'lost';
        payout = 0;
      } else if (anyWon) {
        const hasVoid = allLegs.some((l) => l.status === 'void');
        finalStatus = hasVoid ? 'partially_won' : 'won';
        payout = this.calculateAccumulatorPayout(bet.total_stake, allLegs);
      }

      await pool.query(
        `UPDATE sports_bets
         SET status = ?, payout = ?, settled_at = ?, settlement_source = 'auto'
         WHERE bet_id = ?`,
        [finalStatus, payout, now, bet.bet_id]
      );

      await pool.query('COMMIT');

      // Credit points if needed (outside of DB transaction)
      if (payout > 0) {
        const reason =
          finalStatus === 'void'
            ? `Bet voided – stake refunded (${bet.bet_type})`
            : `Bet won – payout ${payout} points (${bet.bet_type})`;

        const transactionType =
          finalStatus === 'void' ? 'refund' : 'bet_won';

        await PointsService.addPoints(bet.user_id, payout, reason, {
          transactionType,
          relatedTransactionId: null,
        });
      }
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error settling single bet:', error);
      throw error;
    }
  }

  /**
   * Start background worker that periodically runs settlement cycles.
   */
  startSettlementWorker(intervalMs = 2 * 60 * 1000) {
    // Run once after startup
    setTimeout(() => {
      this.runSettlementCycle().catch((err) =>
        console.error('Initial settlement cycle error:', err)
      );
    }, 30 * 1000);

    // Then on interval
    setInterval(() => {
      this.runSettlementCycle().catch((err) =>
        console.error('Periodic settlement cycle error:', err)
      );
    }, intervalMs);

    console.log(
      `✅ Settlement worker started (interval: ${Math.round(
        intervalMs / 1000
      )} seconds)`
    );
  }
}

const settlementService = new SettlementService();
export default settlementService;

