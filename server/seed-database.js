import { db } from './src/database/db.js';
import bcrypt from 'bcryptjs';

console.log('🌱 Seeding SQLite database with test data...\n');

async function seedDatabase() {
  try {
    // Check if users already exist
    const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers.rows[0].count > 0) {
      console.log('⚠️  Database already has users. Skipping seed.');
      console.log('   To re-seed, delete server/data/betting_platform.db and restart.\n');
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date().toISOString();

    // Create test users for each role
    const users = [
      {
        id: db.generateUuid(),
        username: 'owner',
        full_name: 'Platform Owner',
        email: 'owner@example.com',
        password_hash: hashedPassword,
        user_type: 'owner',
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        id: db.generateUuid(),
        username: 'superadmin',
        full_name: 'Super Administrator',
        email: 'superadmin@example.com',
        password_hash: hashedPassword,
        user_type: 'super_admin',
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        id: db.generateUuid(),
        username: 'admin',
        full_name: 'Admin User',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        user_type: 'admin',
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        id: db.generateUuid(),
        username: 'broker1',
        full_name: 'Broker One',
        email: 'broker@example.com',
        password_hash: hashedPassword,
        user_type: 'broker',
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        id: db.generateUuid(),
        username: 'user1',
        full_name: 'Regular User',
        email: 'user@example.com',
        password_hash: hashedPassword,
        user_type: 'regular_user',
        status: 'active',
        created_at: now,
        updated_at: now,
        broker_id: null // Will be set to broker1's ID
      }
    ];

    // Insert users
    console.log('Creating test users...');
    for (const user of users) {
      const brokerId = user.user_type === 'regular_user' ? users[3].id : null;
      
      await db.query(
        `INSERT INTO users (user_id, username, full_name, email, password_hash, user_type, status, created_at, updated_at, broker_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.full_name, user.email, user.password_hash, user.user_type, user.status, user.created_at, user.updated_at, brokerId]
      );
      
      console.log(`  ✅ Created: ${user.username} (${user.email}) - Role: ${user.user_type}`);
    }

    // Create broker entry for broker1
    console.log('\nCreating broker profile...');
    await db.query(
      `INSERT INTO brokers (broker_id, business_name, commission_rate, is_accepting_users, verification_status)
       VALUES (?, ?, ?, ?, ?)`,
      [users[3].id, 'Broker One LLC', 5.0, 1, 'verified']
    );
    console.log('  ✅ Created broker profile');

    // Create user points for regular user
    console.log('\nCreating user points...');
    await db.query(
      `INSERT INTO user_points (balance_id, user_id, current_balance, total_purchased, last_updated)
       VALUES (?, ?, ?, ?, ?)`,
      [db.generateUuid(), users[4].id, 1000, 1000, now]
    );
    console.log('  ✅ Created points balance (1000 points)');

    console.log('\n✨ Database seeded successfully!\n');
    console.log('📋 Test Accounts:');
    console.log('┌────────────────┬──────────────────────────┬──────────────┐');
    console.log('│ Role           │ Email                    │ Password     │');
    console.log('├────────────────┼──────────────────────────┼──────────────┤');
    console.log('│ Owner          │ owner@example.com        │ password123  │  ← Executive portal');
    console.log('│ Super Admin    │ superadmin@example.com   │ password123  │  ← Executive portal');
    console.log('│ Admin          │ admin@example.com        │ password123  │  ← Management portal');
    console.log('│ Broker         │ broker@example.com       │ password123  │  ← Management portal');
    console.log('│ Regular User   │ user@example.com         │ password123  │  ← User portal');
    console.log('\n💡 First time? Use owner@example.com / password123 for Executive, admin@example.com for Management.');
    console.log('└────────────────┴──────────────────────────┴──────────────┘\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    db.close();
  }
}

seedDatabase();
