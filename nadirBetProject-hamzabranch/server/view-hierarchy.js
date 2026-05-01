import { pool } from './src/database/db.js';

const query = `
  SELECT 
    u.username,
    u.user_type,
    p.username as parent,
    c.username as created_by
  FROM users u
  LEFT JOIN users p ON u.parent_id = p.user_id
  LEFT JOIN users c ON u.created_by = c.user_id
  ORDER BY u.created_at DESC
  LIMIT 10
`;

pool.query(query).then(result => {
  console.log('\n📊 User Hierarchy (Most Recent First):\n');
  console.table(result.rows);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
