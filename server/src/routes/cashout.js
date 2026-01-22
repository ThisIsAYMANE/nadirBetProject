import express from 'express';
import { pool, db } from '../database/db.js';

const router = express.Router();

// Get cashout requests for a broker
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT 
        cr.*,
        u.full_name as user_name,
        u.email as user_email
      FROM cashout_requests cr
      JOIN users u ON cr.user_id = u.user_id
      WHERE cr.broker_id = ?
    `;
    
    const params = [userId];
    
    if (status) {
      query += ` AND cr.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY cr.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Cashout requests error:', error);
    res.status(500).json({ error: 'Failed to fetch cashout requests' });
  }
});

// Approve a cashout request
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const currentTime = new Date().toISOString();
    
    const result = await pool.query(
      `UPDATE cashout_requests 
       SET status = 'approved', 
           processed_at = ?, 
           processed_by = ?
       WHERE request_id = ? AND broker_id = ? AND status = 'pending'`,
      [currentTime, userId, id, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cashout request not found or already processed' });
    }
    
    // Fetch the updated record
    const updated = await pool.query(
      'SELECT * FROM cashout_requests WHERE request_id = ?',
      [id]
    );
    
    res.json({ message: 'Cashout request approved successfully', request: updated.rows[0] });
  } catch (error) {
    console.error('Approve cashout error:', error);
    res.status(500).json({ error: 'Failed to approve cashout request' });
  }
});

// Reject a cashout request
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const currentTime = new Date().toISOString();
    const result = await pool.query(
      `UPDATE cashout_requests 
       SET status = 'rejected', 
           processed_at = ?, 
           processed_by = ?,
           rejection_reason = ?
       WHERE request_id = ? AND broker_id = ? AND status = 'pending'`,
      [currentTime, userId, reason, id, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cashout request not found or already processed' });
    }
    
    // Fetch the updated record
    const updated = await pool.query(
      'SELECT * FROM cashout_requests WHERE request_id = ?',
      [id]
    );
    
    res.json({ message: 'Cashout request rejected successfully', request: updated.rows[0] });
  } catch (error) {
    console.error('Reject cashout error:', error);
    res.status(500).json({ error: 'Failed to reject cashout request' });
  }
});

export default router;
