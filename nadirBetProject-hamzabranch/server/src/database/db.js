import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

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

      // Check if we need to seed the database
      const usersCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get();
      if (usersCount.count === 0) {
        this.seedDatabaseSync();
      }
    } catch (error) {
      console.error('Error initializing database schema:', error);
      throw error;
    }
  }

  seedDatabaseSync() {
    console.log('🌱 Seeding SQLite database with test data...');
    try {
      const hashedPassword = bcrypt.hashSync('password123', 10);
      const now = new Date().toISOString();

      const users = [
        { id: this.generateUuid(), username: 'owner', full_name: 'Platform Owner', email: 'owner@example.com', type: 'owner' },
        { id: this.generateUuid(), username: 'superadmin', full_name: 'Super Administrator', email: 'superadmin@example.com', type: 'super_admin' },
        { id: this.generateUuid(), username: 'admin', full_name: 'Admin User', email: 'admin@example.com', type: 'admin' },
        { id: this.generateUuid(), username: 'broker1', full_name: 'Broker One', email: 'broker@example.com', type: 'broker' },
        { id: this.generateUuid(), username: 'user1', full_name: 'Regular User', email: 'user@example.com', type: 'regular_user' }
      ];

      const insertUser = this.db.prepare(`
        INSERT INTO users (user_id, username, full_name, email, password_hash, user_type, status, created_at, updated_at, broker_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertPoints = this.db.prepare(`
        INSERT INTO user_points (balance_id, user_id, current_balance, total_purchased, last_updated)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const user of users) {
        const brokerId = user.type === 'regular_user' ? users[3].id : null;
        insertUser.run(user.id, user.username, user.full_name, user.email, hashedPassword, user.type, 'active', now, now, brokerId);
        
        const balance = user.type === 'regular_user' ? 1000 : 0;
        insertPoints.run(this.generateUuid(), user.id, balance, balance, now);
        console.log(`  ✅ Created: ${user.username} (${user.email}) - Role: ${user.type}`);
      }

      this.db.prepare(`
        INSERT INTO brokers (broker_id, business_name, commission_rate, is_accepting_users, verification_status)
        VALUES (?, ?, ?, ?, ?)
      `).run(users[3].id, 'Broker One LLC', 5.0, 1, 'verified');
      console.log('  ✅ Created broker profile');

      console.log('✨ Database seeded successfully!');
    } catch (err) {
      console.error('❌ Error seeding database:', err);
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
