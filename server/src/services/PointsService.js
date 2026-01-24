import { pool, db } from '../database/db.js';

// Role hierarchy levels (for validation)
const ROLE_HIERARCHY = {
  'owner': 5,
  'super_admin': 4,
  'admin': 3,
  'broker': 2,
  'regular_user': 1
};

class PointsService {
  /**
   * Get user's current points balance
   */
  async getUserBalance(userId) {
    try {
      const result = await pool.query(
        'SELECT current_balance, total_purchased, total_used_betting, total_cashed_out FROM user_points WHERE user_id = ?',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create initial balance if doesn't exist
        const balanceId = db.generateUuid();
        const now = new Date().toISOString();
        
        await pool.query(
          `INSERT INTO user_points (balance_id, user_id, current_balance, total_purchased, total_used_betting, total_cashed_out, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [balanceId, userId, 0, 0, 0, 0, now]
        );

        return {
          current_balance: 0,
          total_purchased: 0,
          total_used_betting: 0,
          total_cashed_out: 0
        };
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get total points allocated to others by this user
   */
  async getAllocatedPoints(userId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(points_remaining), 0) as total_allocated 
       FROM points_allocation 
       WHERE from_user_id = ? AND status = 'active'`,
      [userId]
    );

    return parseInt(result.rows[0].total_allocated || 0);
  }

  /**
   * Get available points for allocation (balance - already allocated)
   */
  async getAvailablePoints(userId) {
    const balance = await this.getUserBalance(userId);
    const allocated = await this.getAllocatedPoints(userId);
    
    return Math.max(0, balance.current_balance - allocated);
  }

  /**
   * Validate if user can allocate points to another user
   */
  async validateAllocation(fromUserId, toUserId, amount) {
    // Get both users
    const usersResult = await pool.query(
      'SELECT user_id, user_type, full_name FROM users WHERE user_id IN (?, ?)',
      [fromUserId, toUserId]
    );

    if (usersResult.rows.length !== 2) {
      throw new Error('One or both users not found');
    }

    const fromUser = usersResult.rows.find(u => u.user_id === fromUserId);
    const toUser = usersResult.rows.find(u => u.user_id === toUserId);

    // Check hierarchy - can only allocate downward
    if (ROLE_HIERARCHY[fromUser.user_type] <= ROLE_HIERARCHY[toUser.user_type]) {
      throw new Error(`${fromUser.user_type} cannot allocate points to ${toUser.user_type}. Can only allocate to lower hierarchy levels.`);
    }

    // Owner can create points from nothing (infinite points source)
    // No balance check needed for owner
    if (fromUser.user_type === 'owner') {
      return { fromUser, toUser, canCreatePoints: true };
    }

    // For non-owners, check available balance
    const available = await this.getAvailablePoints(fromUserId);
    if (available < amount) {
      throw new Error(`Insufficient available points. Available: ${available}, Requested: ${amount}`);
    }

    return { fromUser, toUser, canCreatePoints: false };
  }

  /**
   * Allocate points from one user to another
   */
  async allocatePoints(fromUserId, toUserId, amount, notes = '') {
    const validation = await this.validateAllocation(fromUserId, toUserId, amount);
    const { fromUser, toUser, canCreatePoints } = validation;

    const allocationId = db.generateUuid();
    const ledgerId = db.generateUuid();
    const now = new Date().toISOString();

    try {
      // Start transaction
      await pool.query('BEGIN TRANSACTION');

      // If owner is creating points, add to their balance first
      if (canCreatePoints) {
        const ownerBalance = await this.getUserBalance(fromUserId);
        const newBalance = ownerBalance.current_balance + amount;
        
        await pool.query(
          `UPDATE user_points 
           SET current_balance = ?, total_purchased = total_purchased + ?, last_updated = ?
           WHERE user_id = ?`,
          [newBalance, amount, now, fromUserId]
        );
      }

      // Create allocation record
      await pool.query(
        `INSERT INTO points_allocation (
          allocation_id, from_user_id, to_user_id, points_allocated, 
          points_used, points_remaining, allocation_date, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [allocationId, fromUserId, toUserId, amount, 0, amount, now, 'active', notes, now, now]
      );

      // Update recipient's balance
      const toBalance = await this.getUserBalance(toUserId);
      const newToBalance = toBalance.current_balance + amount;
      
      await pool.query(
        `UPDATE user_points 
         SET current_balance = ?, total_purchased = total_purchased + ?, last_updated = ?
         WHERE user_id = ?`,
        [newToBalance, amount, now, toUserId]
      );

      // Create ledger entries
      await pool.query(
        `INSERT INTO points_ledger (
          ledger_id, user_id, transaction_type, points_change, 
          balance_before, balance_after, related_allocation_id, description, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ledgerId,
          toUserId,
          'allocation_received',
          amount,
          toBalance.current_balance,
          newToBalance,
          allocationId,
          `Received ${amount} points from ${fromUser.full_name || fromUser.user_type}`,
          now,
          fromUserId
        ]
      );

      // Commit transaction
      await pool.query('COMMIT');

      return {
        success: true,
        allocationId,
        from: fromUser.full_name || fromUser.user_type,
        to: toUser.full_name || toUser.user_type,
        amount,
        newBalance: newToBalance
      };

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Deduct points from user (for betting, cashout, etc.)
   */
  async deductPoints(userId, amount, reason, relatedTransactionId = null) {
    const balance = await this.getUserBalance(userId);
    
    if (balance.current_balance < amount) {
      throw new Error(`Insufficient points. Available: ${balance.current_balance}, Required: ${amount}`);
    }

    const ledgerId = db.generateUuid();
    const now = new Date().toISOString();
    const newBalance = balance.current_balance - amount;

    try {
      await pool.query('BEGIN TRANSACTION');

      // Update balance
      await pool.query(
        `UPDATE user_points 
         SET current_balance = ?, total_used_betting = total_used_betting + ?, last_updated = ?
         WHERE user_id = ?`,
        [newBalance, amount, now, userId]
      );

      // Create ledger entry
      await pool.query(
        `INSERT INTO points_ledger (
          ledger_id, user_id, transaction_type, points_change, 
          balance_before, balance_after, related_transaction_id, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ledgerId, userId, 'bet_placed', -amount, balance.current_balance, newBalance, relatedTransactionId, reason, now]
      );

      await pool.query('COMMIT');

      return { success: true, newBalance };
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Credit points to user (for bet wins, refunds, manual adjustments, etc.)
   * @param {string} userId
   * @param {number} amount - positive integer points to add
   * @param {string} reason - human-readable description
   * @param {Object} options
   *    - transactionType: 'bet_won' | 'refund' | 'admin_adjustment' | 'cashout'
   *    - relatedTransactionId: optional transaction id
   */
  async addPoints(userId, amount, reason, options = {}) {
    const {
      transactionType = 'bet_won',
      relatedTransactionId = null,
    } = options;

    if (amount <= 0) {
      throw new Error('Amount to add must be positive');
    }

    const balance = await this.getUserBalance(userId);
    const ledgerId = db.generateUuid();
    const now = new Date().toISOString();
    const newBalance = balance.current_balance + amount;

    try {
      await pool.query('BEGIN TRANSACTION');

      // Update balance; for now we only bump current_balance and last_updated.
      // Aggregates like total_purchased / total_cashed_out are handled by higher-level flows.
      await pool.query(
        `UPDATE user_points 
         SET current_balance = ?, last_updated = ?
         WHERE user_id = ?`,
        [newBalance, now, userId]
      );

      // Create ledger entry
      await pool.query(
        `INSERT INTO points_ledger (
          ledger_id, user_id, transaction_type, points_change, 
          balance_before, balance_after, related_transaction_id, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ledgerId, userId, transactionType, amount, balance.current_balance, newBalance, relatedTransactionId, reason, now]
      );

      await pool.query('COMMIT');

      return { success: true, newBalance };
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Get points history for a user
   */
  async getPointsHistory(userId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM points_ledger 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Get allocations made by a user
   */
  async getAllocationsMadeBy(userId, includeExpired = false) {
    let query = `
      SELECT 
        pa.*,
        u.full_name as recipient_name,
        u.user_type as recipient_role,
        u.email as recipient_email
      FROM points_allocation pa
      INNER JOIN users u ON pa.to_user_id = u.user_id
      WHERE pa.from_user_id = ?
    `;

    if (!includeExpired) {
      query += ` AND pa.status = 'active'`;
    }

    query += ` ORDER BY pa.created_at DESC`;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get allocations received by a user
   */
  async getAllocationsReceivedBy(userId) {
    const result = await pool.query(
      `SELECT 
        pa.*,
        u.full_name as allocator_name,
        u.user_type as allocator_role
      FROM points_allocation pa
      INNER JOIN users u ON pa.from_user_id = u.user_id
      WHERE pa.to_user_id = ? AND pa.status = 'active'
      ORDER BY pa.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Create a points request
   */
  async createPointsRequest(requesterId, requestedFromId, amount, message = '') {
    // Validate hierarchy - can only request from direct superior
    const usersResult = await pool.query(
      'SELECT user_id, user_type, parent_id FROM users WHERE user_id IN (?, ?)',
      [requesterId, requestedFromId]
    );

    if (usersResult.rows.length !== 2) {
      throw new Error('One or both users not found');
    }

    const requester = usersResult.rows.find(u => u.user_id === requesterId);
    const requestedFrom = usersResult.rows.find(u => u.user_id === requestedFromId);

    // Validate can only request from higher hierarchy or parent
    if (ROLE_HIERARCHY[requester.user_type] >= ROLE_HIERARCHY[requestedFrom.user_type]) {
      throw new Error('Can only request points from higher hierarchy levels');
    }

    const requestId = db.generateUuid();
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO points_requests (
        request_id, requester_id, requested_from_id, points_requested, 
        status, request_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [requestId, requesterId, requestedFromId, amount, 'pending', message, now]
    );

    return { success: true, requestId };
  }

  /**
   * Respond to a points request (approve/reject)
   */
  async respondToRequest(requestId, responderId, status, responseMessage = '') {
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error('Status must be approved or rejected');
    }

    const requestResult = await pool.query(
      'SELECT * FROM points_requests WHERE request_id = ?',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      throw new Error('Request not found');
    }

    const request = requestResult.rows[0];

    if (request.status !== 'pending') {
      throw new Error('Request already responded to');
    }

    if (request.requested_from_id !== responderId) {
      throw new Error('You are not authorized to respond to this request');
    }

    const now = new Date().toISOString();

    await pool.query(
      `UPDATE points_requests 
       SET status = ?, response_message = ?, responded_at = ?, responded_by = ?
       WHERE request_id = ?`,
      [status, responseMessage, now, responderId, requestId]
    );

    // If approved, allocate the points
    if (status === 'approved') {
      await this.allocatePoints(
        responderId,
        request.requester_id,
        request.points_requested,
        `Approved request: ${request.request_message || 'No message'}`
      );
    }

    return { success: true, status };
  }

  /**
   * Get pending requests for a user
   */
  async getPendingRequests(userId) {
    const result = await pool.query(
      `SELECT 
        pr.*,
        u.full_name as requester_name,
        u.user_type as requester_role,
        u.email as requester_email
      FROM points_requests pr
      INNER JOIN users u ON pr.requester_id = u.user_id
      WHERE pr.requested_from_id = ? AND pr.status = 'pending'
      ORDER BY pr.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get user's sent requests
   */
  async getUserRequests(userId) {
    const result = await pool.query(
      `SELECT 
        pr.*,
        u.full_name as requested_from_name,
        u.user_type as requested_from_role
      FROM points_requests pr
      INNER JOIN users u ON pr.requested_from_id = u.user_id
      WHERE pr.requester_id = ?
      ORDER BY pr.created_at DESC
      LIMIT 50`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get points statistics for a user
   */
  async getPointsStats(userId) {
    const balance = await this.getUserBalance(userId);
    const allocated = await this.getAllocatedPoints(userId);
    const available = balance.current_balance - allocated;

    const allocationsGiven = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(points_allocated), 0) as total
       FROM points_allocation 
       WHERE from_user_id = ? AND status = 'active'`,
      [userId]
    );

    const allocationsReceived = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(points_allocated), 0) as total
       FROM points_allocation 
       WHERE to_user_id = ? AND status = 'active'`,
      [userId]
    );

    const pendingRequests = await pool.query(
      'SELECT COUNT(*) as count FROM points_requests WHERE requested_from_id = ? AND status = ?',
      [userId, 'pending']
    );

    return {
      balance: balance.current_balance,
      allocated: allocated,
      available: available,
      totalPurchased: balance.total_purchased,
      totalUsedBetting: balance.total_used_betting,
      totalCashedOut: balance.total_cashed_out,
      allocationsGivenCount: parseInt(allocationsGiven.rows[0].count || 0),
      allocationsGivenTotal: parseInt(allocationsGiven.rows[0].total || 0),
      allocationsReceivedCount: parseInt(allocationsReceived.rows[0].count || 0),
      allocationsReceivedTotal: parseInt(allocationsReceived.rows[0].total || 0),
      pendingRequestsCount: parseInt(pendingRequests.rows[0].count || 0)
    };
  }

  /**
   * Get full hierarchy view (for owner/admin monitoring)
   */
  async getHierarchyView(rootUserId = null) {
    let query = `
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.user_type,
        u.status,
        up.current_balance,
        u.parent_id,
        p.full_name as parent_name,
        (SELECT COALESCE(SUM(points_remaining), 0) 
         FROM points_allocation 
         WHERE from_user_id = u.user_id AND status = 'active') as allocated_to_others
      FROM users u
      LEFT JOIN user_points up ON u.user_id = up.user_id
      LEFT JOIN users p ON u.parent_id = p.user_id
    `;

    const params = [];

    if (rootUserId) {
      query += ` WHERE u.parent_id = ? OR u.user_id = ?`;
      params.push(rootUserId, rootUserId);
    }

    query += ` ORDER BY u.user_type DESC, u.created_at ASC`;

    const result = await pool.query(query, params);
    
    return result.rows.map(row => ({
      ...row,
      available: Math.max(0, (row.current_balance || 0) - (row.allocated_to_others || 0))
    }));
  }
}

export default new PointsService();
