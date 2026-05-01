import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/betting_platform.db');
const db = new Database(dbPath);

console.log('🔧 Migrating points_allocation schema...');

try {
  // Check if old schema exists
  const tableInfo = db.prepare("PRAGMA table_info(points_allocation)").all();
  const hasFromUserId = tableInfo.some(col => col.name === 'from_user_id');
  
  if (hasFromUserId) {
    console.log('✅ Schema already up to date!');
    process.exit(0);
  }
  
  console.log('📋 Current columns:', tableInfo.map(c => c.name));
  
  // Begin transaction
  db.exec('BEGIN TRANSACTION');
  
  // Create new table with correct schema
  db.exec(`
    CREATE TABLE points_allocation_new (
      allocation_id TEXT PRIMARY KEY,
      from_user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      to_user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      points_allocated INTEGER NOT NULL CHECK (points_allocated > 0),
      points_used INTEGER DEFAULT 0 CHECK (points_used >= 0),
      points_remaining INTEGER NOT NULL CHECK (points_remaining >= 0),
      allocation_date TEXT NOT NULL,
      expiry_date TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Copy existing data if any (mapping old columns to new)
  const oldData = db.prepare('SELECT * FROM points_allocation').all();
  if (oldData.length > 0) {
    console.log(`📦 Migrating ${oldData.length} existing records...`);
    const insert = db.prepare(`
      INSERT INTO points_allocation_new 
      (allocation_id, from_user_id, to_user_id, points_allocated, points_remaining, allocation_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const row of oldData) {
      // Map broker_id → from_user_id, and generate to_user_id from context
      insert.run(
        row.allocation_id,
        row.broker_id || row.from_user_id,  // fallback
        row.user_id || row.to_user_id,      // fallback
        row.points_allocated,
        row.points_remaining || row.points_allocated,
        row.allocation_date,
        row.created_at || new Date().toISOString(),
        row.updated_at || new Date().toISOString()
      );
    }
  }
  
  // Drop old table and rename new one
  db.exec('DROP TABLE points_allocation');
  db.exec('ALTER TABLE points_allocation_new RENAME TO points_allocation');
  
  // Commit transaction
  db.exec('COMMIT');
  
  console.log('✅ Migration completed successfully!');
  
  // Verify
  const newTableInfo = db.prepare("PRAGMA table_info(points_allocation)").all();
  console.log('📋 New columns:', newTableInfo.map(c => c.name));
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  db.exec('ROLLBACK');
  process.exit(1);
} finally {
  db.close();
}
