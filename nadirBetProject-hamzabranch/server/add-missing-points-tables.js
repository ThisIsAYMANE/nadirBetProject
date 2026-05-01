import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/betting_platform.db');
const db = new Database(dbPath);

console.log('🔧 Adding missing points tables...');

try {
  // Check which tables already exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'points%'").all();
  console.log('📋 Existing points tables:', tables.map(t => t.name));
  
  // Create points_ledger if it doesn't exist
  if (!tables.some(t => t.name === 'points_ledger')) {
    console.log('Creating points_ledger table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS points_ledger (
        ledger_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('allocation_received', 'allocation_given', 'bet_placed', 'bet_won', 'bet_lost', 'cashout', 'refund', 'admin_adjustment')),
        points_change INTEGER NOT NULL,
        balance_before INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        related_allocation_id TEXT REFERENCES points_allocation(allocation_id),
        related_transaction_id TEXT REFERENCES transactions(transaction_id),
        description TEXT,
        created_at TEXT NOT NULL,
        created_by TEXT REFERENCES users(user_id)
      )
    `);
    console.log('✅ Created points_ledger');
  } else {
    console.log('✓ points_ledger already exists');
  }
  
  // Create points_requests if it doesn't exist
  if (!tables.some(t => t.name === 'points_requests')) {
    console.log('Creating points_requests table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS points_requests (
        request_id TEXT PRIMARY KEY,
        requester_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        requested_from_id TEXT NOT NULL REFERENCES users(user_id),
        points_requested INTEGER NOT NULL CHECK (points_requested > 0),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
        request_message TEXT,
        response_message TEXT,
        created_at TEXT NOT NULL,
        responded_at TEXT,
        responded_by TEXT REFERENCES users(user_id)
      )
    `);
    console.log('✅ Created points_requests');
  } else {
    console.log('✓ points_requests already exists');
  }
  
  // Create indexes for performance
  console.log('Creating indexes...');
  db.exec(`CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_points_requests_requester ON points_requests(requester_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_points_requests_requested_from ON points_requests(requested_from_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_points_requests_status ON points_requests(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_points_allocation_from ON points_allocation(from_user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_points_allocation_to ON points_allocation(to_user_id)`);
  
  console.log('✅ All indexes created');
  
  // Verify final state
  const finalTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'points%'").all();
  console.log('📋 Final points tables:', finalTables.map(t => t.name));
  
  console.log('✅ Migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
