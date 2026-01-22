import { db } from './src/database/db.js';

const API_URL = 'http://localhost:3001/api';

console.log('🧪 Testing Phase 2: SQLite Migration\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Check database tables
  console.log('📋 Test 1: Database Tables');
  try {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    const expectedTables = [
      'alerts', 'audit_logs', 'bets', 'broker_reviews', 'brokers',
      'cashout_requests', 'fraud_alerts', 'messages', 'points_allocation',
      'transactions', 'user_points', 'users'
    ];
    
    const foundTables = tables.map(t => t.name);
    const allPresent = expectedTables.every(t => foundTables.includes(t));
    
    if (allPresent) {
      console.log('  ✅ All 12 tables created successfully');
      passed++;
    } else {
      console.log('  ❌ Missing tables');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    failed++;
  }

  // Test 2: Check indexes
  console.log('\n📋 Test 2: Database Indexes');
  try {
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    if (indexes.length >= 15) {
      console.log(`  ✅ ${indexes.length} indexes created`);
      passed++;
    } else {
      console.log(`  ⚠️  Only ${indexes.length} indexes found (expected 15+)`);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    failed++;
  }

  // Test 3: Verify seeded data
  console.log('\n📋 Test 3: Seeded Data');
  try {
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const brokerCount = await db.query('SELECT COUNT(*) as count FROM brokers');
    const pointsCount = await db.query('SELECT COUNT(*) as count FROM user_points');
    
    if (userCount.rows[0].count === 5 && 
        brokerCount.rows[0].count === 1 && 
        pointsCount.rows[0].count === 1) {
      console.log('  ✅ Seed data verified (5 users, 1 broker, 1 points record)');
      passed++;
    } else {
      console.log('  ❌ Seed data incomplete');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    failed++;
  }

  // Test 4: Test authentication
  console.log('\n📋 Test 4: Authentication (Login)');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    
    if (data.token && data.user) {
      console.log('  ✅ Login successful');
      console.log(`     User: ${data.user.full_name}`);
      console.log(`     Role: ${data.user.user_type}`);
      console.log(`     Token: ${data.token.substring(0, 20)}...`);
      passed++;
      
      // Store token for next test
      global.authToken = data.token;
    } else {
      console.log('  ❌ Login response missing token or user');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Login failed:', error.message);
    failed++;
  }

  // Test 5: Test authenticated endpoint
  console.log('\n📋 Test 5: Authenticated API Call');
  try {
    if (!global.authToken) {
      console.log('  ⏭️  Skipped (no auth token from previous test)');
    } else {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${global.authToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.user) {
        console.log('  ✅ Authenticated request successful');
        console.log(`     Verified user: ${data.user.email}`);
        passed++;
      } else {
        console.log('  ❌ Response missing user data');
        failed++;
      }
    }
  } catch (error) {
    console.log('  ❌ Auth check failed:', error.message);
    failed++;
  }

  // Test 6: Test CRUD - Read users
  console.log('\n📋 Test 6: Read Operation (List Users)');
  try {
    const users = await db.query(
      'SELECT user_id, username, email, user_type, status FROM users ORDER BY created_at DESC LIMIT 5'
    );
    
    if (users.rows.length === 5) {
      console.log('  ✅ Successfully queried users');
      users.rows.forEach(u => {
        console.log(`     - ${u.username} (${u.user_type})`);
      });
      passed++;
    } else {
      console.log('  ❌ Expected 5 users, got', users.rows.length);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    failed++;
  }

  // Test 7: Test Update operation
  console.log('\n📋 Test 7: Update Operation');
  try {
    const userResult = await db.query('SELECT user_id FROM users WHERE email = ?', ['user@example.com']);
    const userId = userResult.rows[0].user_id;
    
    const now = new Date().toISOString();
    await db.query(
      'UPDATE users SET last_login = ? WHERE user_id = ?',
      [now, userId]
    );
    
    const updated = await db.query('SELECT last_login FROM users WHERE user_id = ?', [userId]);
    
    if (updated.rows[0].last_login === now) {
      console.log('  ✅ Update operation successful');
      console.log(`     Updated last_login for user@example.com`);
      passed++;
    } else {
      console.log('  ❌ Update did not persist');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✅ All tests passed! Phase 2 migration successful.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }
  
  db.close();
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  db.close();
  process.exit(1);
});
