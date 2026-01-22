import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { pool, db } from '../database/db.js';
import { 
  authenticateToken,
  requireRole,
  requireMinimumRole,
  requireManagePermission
} from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all brokers with pagination and search
// Only admins and above can view brokers
router.get('/', requireMinimumRole('admin'), async (req, res) => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/79668295-0b4a-49ab-ac73-bab0f354ce6f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brokers.js:22',message:'GET /brokers started',data:{query:req.query,userRole:req.user?.role},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        b.broker_id,
        b.business_name,
        b.commission_rate,
        u.status,
        u.created_at,
        u.username,
        u.email,
        u.full_name,
        COUNT(DISTINCT ub.user_id) as total_users_count,
        COUNT(DISTINCT t.transaction_id) as total_transactions_processed,
        COALESCE(SUM(t.amount), 0) as total_revenue
      FROM brokers b
      INNER JOIN users u ON b.broker_id = u.user_id
      LEFT JOIN users ub ON ub.broker_id = b.broker_id
      LEFT JOIN transactions t ON t.user_id = ub.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (LOWER(b.business_name) LIKE LOWER(?) OR LOWER(u.username) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?))`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` GROUP BY b.broker_id, b.business_name, b.commission_rate, u.status, u.created_at, u.username, u.email, u.full_name
               ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/79668295-0b4a-49ab-ac73-bab0f354ce6f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brokers.js:56',message:'About to execute query',data:{query:query.substring(0,200),paramsLength:params.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const result = await pool.query(query, params);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/79668295-0b4a-49ab-ac73-bab0f354ce6f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brokers.js:60',message:'Query executed',data:{rowCount:result.rows.length,firstRow:result.rows[0]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const countResult = await pool.query('SELECT COUNT(*) as count FROM brokers');

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/79668295-0b4a-49ab-ac73-bab0f354ce6f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brokers.js:65',message:'Before transformation',data:{count:countResult.rows[0]?.count,resultRowsLength:result.rows.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Transform data to match frontend Broker interface
    const transformedData = result.rows.map(row => ({
      id: row.broker_id,
      broker_id: row.broker_id,
      name: row.business_name || row.full_name || row.username || 'Unknown',
      email: row.email,
      status: row.status || 'active',
      totalUsers: parseInt(row.total_users_count || 0),
      totalTransactions: parseInt(row.total_transactions_processed || 0),
      revenue: parseFloat(row.total_revenue || 0),
      performanceScore: 0,
      createdAt: row.created_at
    }));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/79668295-0b4a-49ab-ac73-bab0f354ce6f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brokers.js:82',message:'After transformation',data:{transformedCount:transformedData.length,firstTransformed:transformedData[0]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    res.json({
      data: transformedData,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/79668295-0b4a-49ab-ac73-bab0f354ce6f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'brokers.js:94',message:'Error caught',data:{errorMessage:error.message,errorCode:error.code,errorStack:error.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('Get brokers error:', error);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// Get broker by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        b.broker_id,
        b.business_name,
        b.commission_rate,
        u.status,
        u.created_at,
        u.username,
        u.email,
        u.full_name,
        COUNT(DISTINCT ub.user_id) as total_users_count,
        COUNT(DISTINCT t.transaction_id) as total_transactions_processed,
        COALESCE(SUM(t.amount), 0) as total_revenue
      FROM brokers b
      INNER JOIN users u ON b.broker_id = u.user_id
      LEFT JOIN users ub ON ub.broker_id = b.broker_id
      LEFT JOIN transactions t ON t.user_id = ub.user_id
      WHERE b.broker_id = ?
      GROUP BY b.broker_id, b.business_name, b.commission_rate, u.status, u.created_at, u.username, u.email, u.full_name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    const row = result.rows[0];
    // Transform data to match frontend Broker interface
    const transformedBroker = {
      id: row.broker_id,
      broker_id: row.broker_id,
      name: row.business_name || row.full_name || row.username || 'Unknown',
      email: row.email,
      status: row.status || 'active',
      totalUsers: parseInt(row.total_users_count || 0),
      totalTransactions: parseInt(row.total_transactions_processed || 0),
      revenue: parseFloat(row.total_revenue || 0),
      performanceScore: 0,
      createdAt: row.created_at
    };

    res.json(transformedBroker);

  } catch (error) {
    console.error('Get broker error:', error);
    res.status(500).json({ error: 'Failed to fetch broker' });
  }
});

// Create new broker
// Owner and Super Admin can create brokers
router.post('/', requireMinimumRole('super_admin'), [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('businessName').notEmpty().trim().withMessage('Business name is required'),
  body('commissionRate').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 1) {
      throw new Error('Commission rate must be a number between 0 and 1');
    }
    return true;
  })
], async (req, res) => {
  try {
    console.log('Create broker request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: errors.array() 
      });
    }

    let { name, email, password, businessName, commissionRate, description } = req.body;
    
    // Normalize email (lowercase, trim)
    email = email.toLowerCase().trim();
    
    // Ensure commissionRate is a number
    commissionRate = parseFloat(commissionRate);
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      return res.status(400).json({ error: 'Commission rate must be a number between 0 and 1' });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE LOWER(TRIM(email)) = ?',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = db.generateUuid();
    const now = new Date().toISOString();

    // Create broker user first
    await pool.query(`
      INSERT INTO users (user_id, username, full_name, email, password_hash, user_type, status, created_at, updated_at, parent_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email.split('@')[0], name, email, passwordHash, 'broker', 'active', now, now, req.user.id, req.user.id]);

    // Create broker record
    await pool.query(`
      INSERT INTO brokers (broker_id, business_name, commission_rate, created_by, verification_status)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, businessName, commissionRate, req.user.id, 'verified']);

    // Fetch and return the created broker
    const brokerResult = await pool.query(`
      SELECT b.*, u.email, u.username, u.full_name
      FROM brokers b
      INNER JOIN users u ON b.broker_id = u.user_id
      WHERE b.broker_id = ?
    `, [userId]);

    res.status(201).json(brokerResult.rows[0]);

  } catch (error) {
    console.error('Create broker error:', error);
    res.status(500).json({ error: 'Failed to create broker' });
  }
});

// Update broker
router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('businessName').optional().notEmpty().trim(),
  body('commissionRate').optional().isFloat({ min: 0, max: 1 }),
  body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, businessName, commissionRate, status, description } = req.body;

    // Check if broker exists
    const existingBroker = await pool.query(
      'SELECT broker_id FROM brokers WHERE broker_id = ?',
      [id]
    );

    if (existingBroker.rows.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Update user info if provided
    if (name || email || status) {
      const userUpdates = [];
      const userParams = [];

      if (name) {
        userUpdates.push(`full_name = ?`);
        userParams.push(name);
      }
      if (email) {
        userUpdates.push(`email = ?`);
        userParams.push(email);
      }
      if (status) {
        userUpdates.push(`status = ?`);
        userParams.push(status);
      }

      if (userUpdates.length > 0) {
        userUpdates.push(`updated_at = ?`);
        userParams.push(new Date().toISOString());
        userParams.push(id);

        await pool.query(`
          UPDATE users 
          SET ${userUpdates.join(', ')}
          WHERE user_id = ?
        `, userParams);
      }
    }

    // Update broker info
    const brokerUpdates = [];
    const brokerParams = [];

    if (businessName) {
      brokerUpdates.push(`business_name = ?`);
      brokerParams.push(businessName);
    }
    if (commissionRate !== undefined) {
      brokerUpdates.push(`commission_rate = ?`);
      brokerParams.push(commissionRate);
    }
    // Note: status is stored in users table, not brokers table

    if (brokerUpdates.length > 0) {
      brokerParams.push(id);

      await pool.query(`
        UPDATE brokers 
        SET ${brokerUpdates.join(', ')}
        WHERE broker_id = ?
      `, brokerParams);

      // Fetch and return updated broker
      const result = await pool.query(`
        SELECT b.*, u.email, u.username, u.full_name
        FROM brokers b
        INNER JOIN users u ON b.broker_id = u.user_id
        WHERE b.broker_id = ?
      `, [id]);

      res.json(result.rows[0]);
    } else {
      res.json({ message: 'No broker fields to update' });
    }

  } catch (error) {
    console.error('Update broker error:', error);
    res.status(500).json({ error: 'Failed to update broker' });
  }
});

// Delete broker
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if broker exists
    const existingBroker = await pool.query(
      'SELECT broker_id FROM brokers WHERE broker_id = ?',
      [id]
    );

    if (existingBroker.rows.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Soft delete by setting user status to inactive
    const currentTime = new Date().toISOString();
    await pool.query(
      'UPDATE users SET status = ?, updated_at = ? WHERE user_id = ?',
      ['inactive', currentTime, id]
    );

    res.json({ message: 'Broker deleted successfully' });

  } catch (error) {
    console.error('Delete broker error:', error);
    res.status(500).json({ error: 'Failed to delete broker' });
  }
});

export default router;

