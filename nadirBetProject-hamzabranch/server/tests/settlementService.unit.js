import assert from 'assert';
import settlementService from '../src/services/SettlementService.js';

function makeGame(homeName, awayName, homeScore, awayScore) {
  return {
    completed: true,
    home_team: homeName,
    away_team: awayName,
    scores: [
      { name: homeName, score: String(homeScore) },
      { name: awayName, score: String(awayScore) },
    ],
  };
}

async function run() {
  console.log('Running SettlementService unit tests...');

  const gameHomeWin = makeGame('Team A', 'Team B', 2, 1);
  const gameAwayWin = makeGame('Team A', 'Team B', 1, 3);
  const gameDraw = makeGame('Team A', 'Team B', 2, 2);

  // decideLegStatus tests
  assert.strictEqual(
    settlementService.decideLegStatus({ selection: 'home' }, gameHomeWin),
    'won',
    'Home selection should win when home team scores more'
  );

  assert.strictEqual(
    settlementService.decideLegStatus({ selection: 'away' }, gameHomeWin),
    'lost',
    'Away selection should lose when home team scores more'
  );

  assert.strictEqual(
    settlementService.decideLegStatus({ selection: 'away' }, gameAwayWin),
    'won',
    'Away selection should win when away team scores more'
  );

  assert.strictEqual(
    settlementService.decideLegStatus({ selection: 'home' }, gameAwayWin),
    'lost',
    'Home selection should lose when away team scores more'
  );

  assert.strictEqual(
    settlementService.decideLegStatus({ selection: 'draw' }, gameDraw),
    'won',
    'Draw selection should win when scores are equal'
  );

  assert.strictEqual(
    settlementService.decideLegStatus({ selection: 'home' }, gameDraw),
    'void',
    'Non-draw selections should be voided on an exact draw'
  );

  // calculateAccumulatorPayout tests
  const legsAllWon = [
    { status: 'won', odds_when_placed: 2.0 },
    { status: 'won', odds_when_placed: 3.0 },
  ];

  const payoutAllWon = settlementService.calculateAccumulatorPayout(10, legsAllWon);
  assert.strictEqual(
    payoutAllWon,
    60,
    'Accumulator payout should multiply stake by combined odds (10 * 2 * 3 = 60)'
  );

  const legsOneLost = [
    { status: 'won', odds_when_placed: 2.0 },
    { status: 'lost', odds_when_placed: 3.0 },
  ];

  const payoutOneLost = settlementService.calculateAccumulatorPayout(10, legsOneLost);
  assert.strictEqual(
    payoutOneLost,
    0,
    'Accumulator payout should be 0 when not all legs are won'
  );

  console.log('✅ SettlementService unit tests passed.');
}

run().catch((err) => {
  console.error('❌ SettlementService unit tests failed:', err);
  process.exit(1);
});

