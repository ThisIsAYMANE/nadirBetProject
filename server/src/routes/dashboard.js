import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Get dashboard data
router.get('/', async (req, res) => {
  try {
    const { type, brokerId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let dashboardData = {};

    if (type === 'super_admin') {
      // Super admin dashboard data
      const [usersResult, brokersResult, transactionsResult] = await Promise.all([
        pool.query(`
          SELECT * FROM user_dashboard_view 
          ORDER BY created_at DESC 
          LIMIT 50
        `),
        pool.query(`
          SELECT * FROM broker_dashboard_view 
          WHERE status = 'active'
          ORDER BY created_at DESC
        `),
        pool.query(`
          SELECT * FROM transaction_dashboard_view 
          ORDER BY timestamp DESC 
          LIMIT 50
        `)
      ]);

      dashboardData = {
        users: usersResult.rows,
        brokers: brokersResult.rows,
        transactions: transactionsResult.rows
      };

    } else if (type === 'broker') {
      // Broker dashboard data
      const [usersResult, transactionsResult] = await Promise.all([
        pool.query(`
          SELECT * FROM user_dashboard_view 
          WHERE broker_id = $1 
          ORDER BY created_at DESC 
          LIMIT 50
        `, [userId]),
        pool.query(`
          SELECT * FROM transaction_dashboard_view 
          WHERE broker_id = $1 
          ORDER BY timestamp DESC 
          LIMIT 50
        `, [userId])
      ]);

      dashboardData = {
        users: usersResult.rows,
        brokers: [], // Brokers don't see other brokers
        transactions: transactionsResult.rows
      };
    }

    res.json(dashboardData);

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get KPIs
router.get('/kpis', async (req, res) => {
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

// Get chart data
router.get('/charts', async (req, res) => {
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
          TO_CHAR(created_at, 'DD') as name,
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

