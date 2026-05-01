import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data/betting_platform.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

try {
    console.log('⚽ Adding SportMonks tables...\n');

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);

    const executeTableCreation = (tableName, sql) => {
        if (!tableNames.includes(tableName)) {
            console.log(`Creating ${tableName} table...`);
            db.exec(sql);
            console.log(`✅ Created ${tableName}`);
        } else {
            console.log(`✓ ${tableName} already exists`);
        }
    };

    executeTableCreation('sm_continents', `
    CREATE TABLE IF NOT EXISTS sm_continents (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    executeTableCreation('sm_countries', `
    CREATE TABLE IF NOT EXISTS sm_countries (
      id INTEGER PRIMARY KEY,
      continent_id INTEGER REFERENCES sm_continents(id),
      name TEXT NOT NULL,
      image_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    executeTableCreation('sm_leagues', `
    CREATE TABLE IF NOT EXISTS sm_leagues (
      id INTEGER PRIMARY KEY,
      country_id INTEGER REFERENCES sm_countries(id),
      name TEXT NOT NULL,
      active INTEGER DEFAULT 0,
      type TEXT,
      image_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    executeTableCreation('sm_teams', `
    CREATE TABLE IF NOT EXISTS sm_teams (
      id INTEGER PRIMARY KEY,
      country_id INTEGER REFERENCES sm_countries(id),
      venue_id INTEGER,
      name TEXT NOT NULL,
      short_code TEXT,
      image_path TEXT,
      founded INTEGER,
      type TEXT,
      gender TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    executeTableCreation('sm_markets', `
    CREATE TABLE IF NOT EXISTS sm_markets (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    executeTableCreation('sm_bookmakers', `
    CREATE TABLE IF NOT EXISTS sm_bookmakers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log('\nCreating indexes...');
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sm_countries_continent ON sm_countries(continent_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sm_leagues_country ON sm_leagues(country_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sm_teams_country ON sm_teams(country_id)`);
    console.log('✅ All indexes created');

    console.log('\n✅ SportMonks tables migration completed successfully!');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
} finally {
    db.close();
}
