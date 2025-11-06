import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../index.js';

const router = express.Router();

// Get all transactions with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      type = '',
      startDate = '',
      endDate = ''
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM transaction_dashboard_view
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (user_name ILIKE $${params.length + 1} OR user_email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    if (startDate) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM transaction_dashboard_view
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (user_name ILIKE $${countParams.length + 1} OR user_email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    if (status) {
      countQuery += ` AND status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    if (type) {
      countQuery += ` AND type = $${countParams.length + 1}`;
      countParams.push(type);
    }

    if (startDate) {
      countQuery += ` AND timestamp >= $${countParams.length + 1}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ` AND timestamp <= $${countParams.length + 1}`;
      countParams.push(endDate);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM transaction_dashboard_view WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Update transaction status
router.put('/:id', [
  body('status').isIn(['pending', 'completed', 'failed', 'cancelled']),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, description } = req.body;

    // Check if transaction exists
    const existingTransaction = await pool.query(
      'SELECT transaction_id FROM transactions WHERE transaction_id = $1',
      [id]
    );

    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction
    const updates = ['status = $1', 'processed_at = CURRENT_TIMESTAMP'];
    const params = [status];
    let paramCount = 2;

    if (description) {
      updates.push(`description = $${paramCount++}`);
      params.push(description);
    }

    params.push(id);

    const result = await pool.query(`
      UPDATE transactions 
      SET ${updates.join(', ')}
      WHERE transaction_id = $${paramCount}
      RETURNING *
    `, params);

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    let dateFilter = '';
    if (period === '7days') {
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === '30days') {
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (period === '90days') {
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '90 days'";
    }

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        SUM(CASE WHEN status = 'completed' THEN cash_amount ELSE 0 END) as total_amount,
        AVG(CASE WHEN status = 'completed' THEN cash_amount ELSE NULL END) as average_amount
      FROM transactions 
      WHERE 1=1 ${dateFilter}
    `);

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

// Get transaction trends
router.get('/stats/trends', async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    let dateFilter = '';
    if (period === '7days') {
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === '30days') {
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (period === '90days') {
      dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '90 days'";
    }

    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN status = 'completed' THEN cash_amount ELSE 0 END) as total_amount
      FROM transactions 
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at)
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Get transaction trends error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction trends' });
  }
});

export default router;








