import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Get KPIs for dashboard
router.get('/', async (req, res) => {
  try {
    const { type, brokerId } = req.query;
    const userId = req.user.id;

    let kpis = [];

    if (type === 'super_admin') {
      // Super admin KPIs
      const result = await pool.query('SELECT * FROM super_admin_kpis');
      kpis = result.rows;

    } else if (type === 'broker') {
      // Broker KPIs
      const result = await pool.query(`
        SELECT 
          'Total Earnings' as title,
          CONCAT('$', ROUND(SUM(cash_amount) / 1000, 1), 'K') as value,
          0 as change,
          'stable' as trend
        FROM transactions 
        WHERE broker_id = $1 AND status = 'completed'
        UNION ALL
        SELECT 
          'Active Users' as title,
          COUNT(*)::text as value,
          0 as change,
          'stable' as trend
        FROM users 
        WHERE broker_id = $1 AND status = 'active'
        UNION ALL
        SELECT 
          'Pending Cashouts' as title,
          COUNT(*)::text as value,
          0 as change,
          'stable' as trend
        FROM cashout_requests 
        WHERE broker_id = $1 AND status = 'pending'
        UNION ALL
        SELECT 
          'Success Rate' as title,
          CONCAT(ROUND(
            (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(*), 0)), 1
          ), '%') as value,
          0 as change,
          'stable' as trend
        FROM transactions 
        WHERE broker_id = $1
      `, [userId]);

      kpis = result.rows;
    }

    res.json(kpis);

  } catch (error) {
    console.error('KPIs error:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

export default router;

