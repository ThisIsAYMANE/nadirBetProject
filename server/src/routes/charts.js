import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Get chart data
router.get('/', async (req, res) => {
  try {
    const { type, period, brokerId } = req.query;
    const userId = req.user.id;

    let chartData = [];

    if (type === 'revenue') {
      const result = await pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as name,
          SUM(cash_amount) as value
        FROM transactions 
        WHERE status = 'completed'
        ${brokerId ? 'AND broker_id = $1' : ''}
        AND created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `, brokerId ? [brokerId] : []);

      chartData = result.rows;

    } else if (type === 'performance') {
      const result = await pool.query(`
        SELECT 
          TO_CHAR(DATE(created_at), 'DD') as name,
          COUNT(*) as value
        FROM transactions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ${brokerId ? 'AND broker_id = $1' : ''}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
        LIMIT 30
      `, brokerId ? [brokerId] : []);

      chartData = result.rows;
    }

    res.json(chartData);

  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

export default router;

