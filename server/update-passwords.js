import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/betting_platform',
  ssl: false,
});

const passwords = {
  'admin@bettingplatform.com': 'admin123',
  'broker1@premiumbets.com': 'broker123',
  'broker2@globalgaming.com': 'broker123',
  'broker3@elitesports.com': 'broker123',
  'john.smith@email.com': 'user123',
  'sarah.j@email.com': 'user123',
  'mike.w@email.com': 'user123',
  'emma.davis@email.com': 'user123'
};

async function updatePasswords() {
  try {
    await pool.connect();
    console.log('✅ Connected to database\n');

    for (const [email, password] of Object.entries(passwords)) {
      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hash, email]
      );
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated password for ${email}`);
      } else {
        console.log(`⚠️  No user found with email ${email}`);
      }
    }

    console.log('\n✅ All passwords updated successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    await pool.end();
    process.exit(1);
  }
}

updatePasswords();
