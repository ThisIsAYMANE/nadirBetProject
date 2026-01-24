import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/betting_platform.db');
const db = new Database(dbPath);

console.log('🔧 Adding sports betting tables if missing...');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);
  console.log('📋 Existing tables:', tableNames);

  // sports_bets table
  if (!tableNames.includes('sports_bets')) {
    console.log('Creating sports_bets table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS sports_bets (
        bet_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id),
        broker_id TEXT REFERENCES users(user_id),
        bet_type TEXT NOT NULL CHECK (bet_type IN ('single', 'accumulator', 'system')),
        total_stake INTEGER NOT NULL CHECK (total_stake > 0),
        potential_payout INTEGER NOT NULL CHECK (potential_payout >= 0),
        payout INTEGER DEFAULT 0 CHECK (payout >= 0),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void', 'partially_won', 'cancelled')),
        odds_format TEXT DEFAULT 'decimal',
        sport_key TEXT,
        created_at TEXT NOT NULL,
        settled_at TEXT,
        settlement_source TEXT DEFAULT 'auto' CHECK (settlement_source IN ('auto', 'manual'))
      );
    `);
    console.log('✅ Created sports_bets');
  } else {
    console.log('✓ sports_bets already exists');
  }

  // bet_legs table
  if (!tableNames.includes('bet_legs')) {
    console.log('Creating bet_legs table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS bet_legs (
        leg_id TEXT PRIMARY KEY,
        bet_id TEXT NOT NULL REFERENCES sports_bets(bet_id) ON DELETE CASCADE,
        sport_key TEXT NOT NULL,
        league TEXT,
        event_id TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        market_type TEXT NOT NULL,
        selection TEXT NOT NULL,
        line TEXT,
        odds_when_placed REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
        commence_time TEXT,
        result_fetched_at TEXT,
        bookmaker_key TEXT
      );
    `);
    console.log('✅ Created bet_legs');
  } else {
    console.log('✓ bet_legs already exists');
  }

  // odds_cache table (optional, for persistent caching/analytics)
  if (!tableNames.includes('odds_cache')) {
    console.log('Creating odds_cache table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS odds_cache (
        cache_key TEXT PRIMARY KEY,
        sport_key TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
    `);
    console.log('✅ Created odds_cache');
  } else {
    console.log('✓ odds_cache already exists');
  }

  // system_bet_combinations table (for system bets support)
  if (!tableNames.includes('system_bet_combinations')) {
    console.log('Creating system_bet_combinations table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_bet_combinations (
        combination_id TEXT PRIMARY KEY,
        bet_id TEXT NOT NULL REFERENCES sports_bets(bet_id) ON DELETE CASCADE,
        legs_json TEXT NOT NULL, -- JSON array of leg_ids in this combination
        stake INTEGER NOT NULL CHECK (stake >= 0),
        potential_win INTEGER NOT NULL CHECK (potential_win >= 0),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void'))
      );
    `);
    console.log('✅ Created system_bet_combinations');
  } else {
    console.log('✓ system_bet_combinations already exists');
  }

  // bet_limits table (configurable limits by role/broker)
  if (!tableNames.includes('bet_limits')) {
    console.log('Creating bet_limits table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS bet_limits (
        limit_id TEXT PRIMARY KEY,
        role_type TEXT NOT NULL,
        broker_id TEXT REFERENCES users(user_id),
        min_stake INTEGER DEFAULT 1 CHECK (min_stake >= 0),
        max_stake INTEGER DEFAULT 1000000 CHECK (max_stake >= 0),
        max_payout INTEGER DEFAULT 10000000 CHECK (max_payout >= 0),
        max_legs_in_accumulator INTEGER DEFAULT 10 CHECK (max_legs_in_accumulator >= 1),
        max_bets_per_day INTEGER DEFAULT 100 CHECK (max_bets_per_day >= 1),
        allowed_markets TEXT, -- JSON list of allowed market keys
        is_active INTEGER DEFAULT 1
      );
    `);
    console.log('✅ Created bet_limits');
  } else {
    console.log('✓ bet_limits already exists');
  }

  // Indexes
  console.log('Creating betting-related indexes (IF NOT EXISTS)...');
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sports_bets_user_id ON sports_bets(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sports_bets_status ON sports_bets(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sports_bets_created_at ON sports_bets(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bet_legs_bet_id ON bet_legs(bet_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bet_legs_event_id ON bet_legs(event_id)`);

  console.log('✅ Sports betting tables migration completed successfully!');
} catch (error) {
  console.error('❌ Sports betting migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}

