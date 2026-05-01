import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/betting_platform.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

try {
  console.log('🎰 Adding casino tables...\n');

  // Check existing tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);

  // Create game_sessions table
  if (!tableNames.includes('game_sessions')) {
    console.log('Creating game_sessions table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        game_id TEXT NOT NULL,
        session_token TEXT NOT NULL,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        ended_at TEXT,
        initial_balance INTEGER NOT NULL,
        total_bet INTEGER DEFAULT 0,
        total_win INTEGER DEFAULT 0,
        session_duration INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created game_sessions');
  } else {
    console.log('✓ game_sessions already exists');
  }

  // Create recent_games table
  if (!tableNames.includes('recent_games')) {
    console.log('Creating recent_games table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS recent_games (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        game_id TEXT NOT NULL,
        last_played TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_id)
      )
    `);
    console.log('✅ Created recent_games');
  } else {
    console.log('✓ recent_games already exists');
  }

  // Create casino_transactions table
  if (!tableNames.includes('casino_transactions')) {
    console.log('Creating casino_transactions table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS casino_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        session_id TEXT,
        transaction_id TEXT UNIQUE NOT NULL,
        game_uuid TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('balance', 'bet', 'win', 'refund', 'rollback')),
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        round_id TEXT,
        bet_transaction_id TEXT,
        rollback_transactions TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        processed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created casino_transactions');
  } else {
    console.log('✓ casino_transactions already exists');
  }

  // Create indexes
  console.log('\nCreating indexes...');
  db.exec(`CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_game_sessions_session_token ON game_sessions(session_token)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_recent_games_user_id ON recent_games(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_casino_transactions_transaction_id ON casino_transactions(transaction_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_casino_transactions_user_id ON casino_transactions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_casino_transactions_session_id ON casino_transactions(session_id)`);
  console.log('✅ All indexes created');

  // Check if user_profiles table exists, create if not
  console.log('\nChecking user_profiles table...');
  if (!tableNames.includes('user_profiles')) {
    console.log('Creating user_profiles table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
        currency TEXT DEFAULT '${process.env.CASINO_DEFAULT_CURRENCY || 'EUR'}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created user_profiles table');
  } else {
    console.log('✓ user_profiles already exists');
    
    // Check if currency column exists
    const userProfilesInfo = db.prepare("PRAGMA table_info(user_profiles)").all();
    const hasCurrency = userProfilesInfo.some(col => col.name === 'currency');
    
    if (!hasCurrency) {
      console.log('Adding currency column to user_profiles...');
      db.exec(`ALTER TABLE user_profiles ADD COLUMN currency TEXT DEFAULT '${process.env.CASINO_DEFAULT_CURRENCY || 'EUR'}'`);
      console.log('✅ Added currency column');
    } else {
      console.log('✓ currency column already exists');
    }
  }

  console.log('\n✅ Casino tables migration completed successfully!');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
