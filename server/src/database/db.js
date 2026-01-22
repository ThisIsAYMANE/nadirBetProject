import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseWrapper {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/betting_platform.db');
    const dbDir = path.dirname(dbPath);
    
    // Ensure data directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints
    
    this.initializeSchema();
  }
  
  initializeSchema() {
    try {
      // Check if tables exist
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      
      if (tables.length === 0) {
        console.log('Initializing database schema...');
        const schemaPath = path.join(__dirname, 'sqlite-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            this.db.exec(statement);
          }
        }
        
        console.log('Database schema initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing database schema:', error);
      throw error;
    }
  }
  
  // Async-compatible query interface (wraps synchronous better-sqlite3)
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        // Determine if this is a SELECT or INSERT/UPDATE/DELETE query
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
        const isReturning = sql.toUpperCase().includes('RETURNING');
        
        if (isSelect || isReturning) {
          const stmt = this.db.prepare(sql);
          const rows = stmt.all(...params);
          resolve({ rows, rowCount: rows.length });
        } else {
          const stmt = this.db.prepare(sql);
          const info = stmt.run(...params);
          
          // For compatibility with PostgreSQL pg library
          resolve({
            rows: [],
            rowCount: info.changes,
            lastInsertRowid: info.lastInsertRowid
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Transaction support
  transaction(callback) {
    const transactionFn = this.db.transaction(callback);
    return transactionFn();
  }
  
  // Helper: Generate UUID
  generateUuid() {
    return uuidv4();
  }
  
  // Helper: Get current ISO timestamp
  getCurrentTimestamp() {
    return new Date().toISOString();
  }
  
  // Helper: Execute a single statement (useful for CREATE, ALTER, etc.)
  exec(sql) {
    return this.db.exec(sql);
  }
  
  // Helper: Prepare a statement (for reuse)
  prepare(sql) {
    return this.db.prepare(sql);
  }
  
  // Close database connection
  close() {
    this.db.close();
  }
}

// Export singleton instance
export const db = new DatabaseWrapper();

// For compatibility with routes expecting a 'pool'
export const pool = {
  query: (sql, params) => db.query(sql, params),
  connect: async () => ({
    query: (sql, params) => db.query(sql, params),
    release: () => {}
  })
};

export default db;
