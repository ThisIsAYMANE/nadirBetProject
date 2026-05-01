/**
 * Reset passwords for seed users to "password123".
 * Run when you get 401 on login and the DB already had users (seed was skipped).
 *
 * Usage: node reset-seed-passwords.js
 */
import { db } from './src/database/db.js';
import bcrypt from 'bcryptjs';

const SEED_EMAILS = [
  'owner@example.com',
  'superadmin@example.com',
  'admin@example.com',
  'broker@example.com',
  'user@example.com',
];
const NEW_PASSWORD = 'password123';

async function main() {
  console.log('🔐 Resetting passwords for seed users to:', NEW_PASSWORD, '\n');

  const hash = await bcrypt.hash(NEW_PASSWORD, 10);

  for (const email of SEED_EMAILS) {
    const result = await db.query(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?',
      [hash, new Date().toISOString(), email]
    );
    if (result.rowCount > 0) {
      console.log('  ✅', email);
    } else {
      const exists = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
      if (exists.rows.length === 0) {
        console.log('  ⏭️', email, '(user not in DB, run seed first or add user manually)');
      } else {
        console.log('  ✅', email, '(updated)');
      }
    }
  }

  console.log('\n📋 Use these to log in:');
  console.log('   Executive: owner@example.com /', NEW_PASSWORD);
  console.log('   Management: admin@example.com /', NEW_PASSWORD);
  console.log('   User portal: user@example.com /', NEW_PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
