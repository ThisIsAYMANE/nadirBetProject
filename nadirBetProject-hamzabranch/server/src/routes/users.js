import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { pool, db } from '../database/db.js';
import { 
  authenticateToken,
  requireRole, 
  requireMinimumRole,
  canCreateRole,
  requireManagePermission
} from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users with pagination and search
// Only admins and above can view all users
router.get('/', requireMinimumRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        user_id,
        username,
        full_name as name,
        email,
        user_type as role,
        status,
        created_at,
        updated_at,
        broker_id
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (LOWER(full_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM user_dashboard_view WHERE id = ?',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['owner', 'super_admin', 'admin', 'shop', 'broker', 'regular_user'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, brokerId } = req.body;
    const creatorId = req.user.id;
    const creatorRole = req.user.role;

    // Define role creation permissions
    const roleCreationRules = {
      'owner': ['super_admin', 'admin', 'shop', 'broker', 'regular_user'],
      'super_admin': ['admin', 'shop', 'broker', 'regular_user'],
      'admin': ['shop', 'broker', 'regular_user'],
      'shop': ['regular_user'],
      'broker': ['regular_user'],
      'regular_user': []
    };

    // Check if creator can create this role
    const allowedRoles = roleCreationRules[creatorRole] || [];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        error: `${creatorRole} cannot create ${role}`,
        allowedToCreate: allowedRoles
      });
    }

    // Determine broker/shop assignment
    let assignedBrokerId = brokerId;
    
    // If creator is a broker or shop, auto-assign to them
    if ((creatorRole === 'broker' || creatorRole === 'shop') && role === 'regular_user') {
      assignedBrokerId = creatorId;
    }
    
    // Validate that regular users MUST have a broker/shop assigned
    if (role === 'regular_user' && !assignedBrokerId) {
      return res.status(400).json({ 
        error: 'Regular users must be assigned to a broker or shop',
        message: 'Please select a broker or shop to assign this user to'
      });
    }

    // If broker/shop is specified, validate it exists and is actually a broker or shop
    if (assignedBrokerId && role === 'regular_user') {
      const assigneeCheck = await pool.query(
        'SELECT user_id, user_type FROM users WHERE user_id = ? AND user_type IN (?, ?)',
        [assignedBrokerId, 'broker', 'shop']
      );
      
      if (assigneeCheck.rows.length === 0) {
        return res.status(400).json({ 
          error: 'Invalid broker or shop',
          message: 'The specified broker or shop does not exist'
        });
      }
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = db.generateUuid();
    const now = new Date().toISOString();

    try {
      // Create user with hierarchy tracking
      await pool.query(`
        INSERT INTO users (
          user_id, username, full_name, email, password_hash, 
          user_type, status, broker_id, parent_id, created_by,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        email.split('@')[0],
        name,
        email,
        hashedPassword,
        role,
        'active',
        assignedBrokerId || null, // Use validated broker assignment
        creatorId, // parent_id
        creatorId, // created_by
        now,
        now
      ]);

      // Fetch created user
      const result = await pool.query(
        'SELECT user_id, username, full_name, email, user_type, status, created_by, parent_id, created_at FROM users WHERE user_id = ?',
        [userId]
      );

      res.status(201).json({
        message: 'User created successfully',
        user: result.rows[0]
      });
    } catch (dbError) {
      console.error('Database error creating user:', dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (requires management permission)
router.put('/:id', requireManagePermission, [
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['super_admin', 'admin', 'shop', 'broker', 'regular_user']),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, role, status, brokerId } = req.body;
    
    console.log('Update user request:', { id, name, email, role, status, brokerId });

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name) {
      updates.push(`full_name = ?`);
      params.push(name);
    }
    if (email) {
      updates.push(`email = ?`);
      params.push(email);
    }
    if (role) {
      updates.push(`user_type = ?`);
      params.push(role);
    }
    if (status) {
      updates.push(`status = ?`);
      params.push(status);
    }
    if (brokerId !== undefined) {
      updates.push(`broker_id = ?`);
      params.push(brokerId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = ?`);
    params.push(new Date().toISOString());
    params.push(id);

    await pool.query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `, params);

    // Fetch updated user
    const result = await pool.query(`
      SELECT user_id, username, full_name, email, user_type, status, updated_at 
      FROM users WHERE user_id = ?
    `, [id]);

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (requires management permission)
router.delete('/:id', requireManagePermission, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by setting status to inactive
    const currentTime = new Date().toISOString();
    await pool.query(
      'UPDATE users SET status = ?, updated_at = ? WHERE user_id = ?',
      ['inactive', currentTime, id]
    );

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/users/profile
 * Get current user's profile
 * Requires authentication
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile
    const profileResult = await pool.query(
      'SELECT currency FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    const userResult = await pool.query(
      'SELECT email, full_name, username FROM users WHERE user_id = ?',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      profile: {
        currency: profileResult.rows[0]?.currency || 'EUR',
        full_name: userResult.rows[0]?.full_name,
        email: userResult.rows[0]?.email,
        username: userResult.rows[0]?.username,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile (including currency)
 * Requires authentication
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { currency, full_name, email } = req.body;

    // Validate currency if provided
    if (currency) {
      const validCurrencies = ['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'];
      if (!validCurrencies.includes(currency.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid currency code' });
      }
    }

    // Update user profile
    if (currency || full_name || email) {
      // Update user_profiles table for currency
      if (currency) {
        // Check if profile exists
        const profileCheck = await pool.query(
          'SELECT user_id FROM user_profiles WHERE user_id = ?',
          [userId]
        );

        if (profileCheck.rows.length === 0) {
          // Create profile if doesn't exist
          await pool.query(
            'INSERT INTO user_profiles (user_id, currency) VALUES (?, ?)',
            [userId, currency.toUpperCase()]
          );
        } else {
          // Update existing profile
          await pool.query(
            'UPDATE user_profiles SET currency = ? WHERE user_id = ?',
            [currency.toUpperCase(), userId]
          );
        }
      }

      // Update users table for full_name and email
      const userUpdates = [];
      const userParams = [];

      if (full_name) {
        userUpdates.push('full_name = ?');
        userParams.push(full_name);
      }

      if (email) {
        // Check if email already exists
        const existingEmail = await pool.query(
          'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
          [email, userId]
        );

        if (existingEmail.rows.length > 0) {
          return res.status(400).json({ error: 'Email already in use' });
        }

        userUpdates.push('email = ?');
        userParams.push(email);
      }

      if (userUpdates.length > 0) {
        userParams.push(userId);
        await pool.query(
          `UPDATE users SET ${userUpdates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
          userParams
        );
      }
    }

    // Get updated profile
    const profileResult = await pool.query(
      'SELECT currency FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    const userResult = await pool.query(
      'SELECT email, full_name FROM users WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      profile: {
        currency: profileResult.rows[0]?.currency || 'EUR',
        full_name: userResult.rows[0]?.full_name,
        email: userResult.rows[0]?.email,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

