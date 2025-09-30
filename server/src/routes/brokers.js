import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { pool } from '../index.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all brokers with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM broker_dashboard_view
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM broker_dashboard_view');

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Get brokers error:', error);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// Get broker by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM broker_dashboard_view WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Get broker error:', error);
    res.status(500).json({ error: 'Failed to fetch broker' });
  }
});

// Create new broker
router.post('/', requireRole(['super_admin']), [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('businessName').notEmpty().trim(),
  body('commissionRate').isFloat({ min: 0, max: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, businessName, commissionRate, description } = req.body;

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create broker user first
    const userResult = await pool.query(`
      INSERT INTO users (username, full_name, email, password_hash, user_type, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id
    `, [email.split('@')[0], name, email, passwordHash, 'broker', 'active']);

    const userId = userResult.rows[0].user_id;

    // Create broker record
    const brokerResult = await pool.query(`
      INSERT INTO brokers (broker_id, business_name, commission_rate, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, businessName, commissionRate, req.user.id]);

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
      'SELECT broker_id FROM brokers WHERE broker_id = $1',
      [id]
    );

    if (existingBroker.rows.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Update user info if provided
    if (name || email) {
      const userUpdates = [];
      const userParams = [];
      let paramCount = 1;

      if (name) {
        userUpdates.push(`full_name = $${paramCount++}`);
        userParams.push(name);
      }
      if (email) {
        userUpdates.push(`email = $${paramCount++}`);
        userParams.push(email);
      }

      if (userUpdates.length > 0) {
        userUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
        userParams.push(id);

        await pool.query(`
          UPDATE users 
          SET ${userUpdates.join(', ')}
          WHERE user_id = $${paramCount}
        `, userParams);
      }
    }

    // Update broker info
    const brokerUpdates = [];
    const brokerParams = [];
    let paramCount = 1;

    if (businessName) {
      brokerUpdates.push(`business_name = $${paramCount++}`);
      brokerParams.push(businessName);
    }
    if (commissionRate !== undefined) {
      brokerUpdates.push(`commission_rate = $${paramCount++}`);
      brokerParams.push(commissionRate);
    }
    if (status) {
      brokerUpdates.push(`status = $${paramCount++}`);
      brokerParams.push(status);
    }
    if (description !== undefined) {
      brokerUpdates.push(`description = $${paramCount++}`);
      brokerParams.push(description);
    }

    if (brokerUpdates.length > 0) {
      brokerUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
      brokerParams.push(id);

      const result = await pool.query(`
        UPDATE brokers 
        SET ${brokerUpdates.join(', ')}
        WHERE broker_id = $${paramCount}
        RETURNING *
      `, brokerParams);

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
      'SELECT broker_id FROM brokers WHERE broker_id = $1',
      [id]
    );

    if (existingBroker.rows.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Soft delete by setting user status to inactive
    await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      ['inactive', id]
    );

    res.json({ message: 'Broker deleted successfully' });

  } catch (error) {
    console.error('Delete broker error:', error);
    res.status(500).json({ error: 'Failed to delete broker' });
  }
});

export default router;

