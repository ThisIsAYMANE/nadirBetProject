import { pool } from './src/database/db.js';

pool.query('PRAGMA table_info(brokers)').then(result => {
  console.log('\n📋 Brokers table columns:');
  console.table(result.rows);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
