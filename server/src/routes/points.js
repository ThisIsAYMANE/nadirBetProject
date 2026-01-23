import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireMinimumRole } from '../middleware/auth.js';
import PointsService from '../services/PointsService.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/points/balance
 * Get current user's points balance
 */
router.get('/balance', async (req, res) => {
  try {
    const balance = await PointsService.getUserBalance(req.user.id);
    const stats = await PointsService.getPointsStats(req.user.id);

    res.json({
      balance: balance.current_balance,
      available: stats.available,
      allocated: stats.allocated,
      stats
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

/**
 * GET /api/points/stats
 * Get comprehensive points statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await PointsService.getPointsStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/points/history
 * Get points transaction history
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await PointsService.getPointsHistory(req.user.id, parseInt(limit));
    
    res.json({
      history,
      total: history.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * GET /api/points/allocations
 * Get allocations made and received
 */
router.get('/allocations', async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    
    let allocationsGiven = [];
    let allocationsReceived = [];

    if (type === 'given' || type === 'all') {
      allocationsGiven = await PointsService.getAllocationsMadeBy(req.user.id);
    }

    if (type === 'received' || type === 'all') {
      allocationsReceived = await PointsService.getAllocationsReceivedBy(req.user.id);
    }

    res.json({
      given: allocationsGiven,
      received: allocationsReceived
    });
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

/**
 * POST /api/points/allocate
 * Allocate points to another user
 * Requires: admin level or higher
 */
router.post('/allocate', [
  requireMinimumRole('broker'),
  body('toUserId').notEmpty().trim(),
  body('amount').isInt({ min: 1 }),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { toUserId, amount, notes } = req.body;
    const fromUserId = req.user.id;

    const result = await PointsService.allocatePoints(
      fromUserId,
      toUserId,
      parseInt(amount),
      notes || ''
    );

    res.status(201).json({
      message: 'Points allocated successfully',
      allocation: result
    });

  } catch (error) {
    console.error('Allocate points error:', error);
    
    if (error.message.includes('Insufficient') || 
        error.message.includes('cannot allocate') ||
        error.message.includes('not found')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to allocate points' });
  }
});

/**
 * POST /api/points/request
 * Request points from superior
 */
router.post('/request', [
  body('requestedFromId').notEmpty().trim(),
  body('amount').isInt({ min: 1 }),
  body('message').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestedFromId, amount, message } = req.body;

    const result = await PointsService.createPointsRequest(
      req.user.id,
      requestedFromId,
      parseInt(amount),
      message || ''
    );

    res.status(201).json({
      message: 'Request created successfully',
      request: result
    });

  } catch (error) {
    console.error('Create request error:', error);
    
    if (error.message.includes('Can only request') || error.message.includes('not found')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create request' });
  }
});

/**
 * GET /api/points/requests
 * Get points requests (sent and received)
 */
router.get('/requests', async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    
    let sent = [];
    let received = [];

    if (type === 'sent' || type === 'all') {
      sent = await PointsService.getUserRequests(req.user.id);
    }

    if (type === 'received' || type === 'all') {
      received = await PointsService.getPendingRequests(req.user.id);
    }

    res.json({
      sent,
      received,
      totalPending: received.length
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

/**
 * POST /api/points/requests/:requestId/respond
 * Approve or reject a points request
 */
router.post('/requests/:requestId/respond', [
  body('status').isIn(['approved', 'rejected']),
  body('message').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { requestId } = req.params;
    const { status, message } = req.body;

    const result = await PointsService.respondToRequest(
      requestId,
      req.user.id,
      status,
      message || ''
    );

    res.json({
      message: `Request ${status} successfully`,
      result
    });

  } catch (error) {
    console.error('Respond to request error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('not authorized') ||
        error.message.includes('already responded')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});

/**
 * GET /api/points/hierarchy
 * Get hierarchy view of points distribution
 * Requires: admin level or higher
 */
router.get('/hierarchy', requireMinimumRole('admin'), async (req, res) => {
  try {
    const { rootUserId } = req.query;
    const hierarchy = await PointsService.getHierarchyView(rootUserId || null);

    res.json({
      hierarchy,
      total: hierarchy.length
    });

  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({ error: 'Failed to fetch hierarchy' });
  }
});

export default router;
