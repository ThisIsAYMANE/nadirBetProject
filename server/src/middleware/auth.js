import jwt from 'jsonwebtoken';
import { pool } from '../database/db.js';

// Role hierarchy levels (higher number = more power)
const ROLE_HIERARCHY = {
  'owner': 5,
  'super_admin': 4,
  'admin': 3,
  'shop': 2,          // Same level as broker, just different business name
  'broker': 2,
  'regular_user': 1
};

// Role creation permissions (who can create what)
const ROLE_CREATION_RULES = {
  'owner': ['super_admin', 'admin', 'shop', 'broker', 'regular_user'],
  'super_admin': ['admin', 'shop', 'broker', 'regular_user'],
  'admin': ['shop', 'broker', 'regular_user'],
  'shop': ['regular_user'],      // Shop can only create regular users
  'broker': ['regular_user'],    // Broker can only create regular users
  'regular_user': []
};

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify user still exists and is active
    const result = await pool.query(
      'SELECT user_id, username, email, user_type, status FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    req.user = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.user_type,
      status: user.status
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check if user has one of the allowed roles
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Check if user has minimum role level (role hierarchy)
export const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Insufficient role level',
        required: minimumRole,
        current: req.user.role
      });
    }

    next();
  };
};

// Check if user can create a specific role
export const canCreateRole = (targetRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowedRoles = ROLE_CREATION_RULES[req.user.role] || [];
    
    if (!allowedRoles.includes(targetRole)) {
      return res.status(403).json({
        error: `${req.user.role} cannot create ${targetRole}`,
        allowedToCreate: allowedRoles
      });
    }

    next();
  };
};

// Check if user can manage another user (based on hierarchy)
export const canManageUser = async (managerId, targetUserId) => {
  try {
    const result = await pool.query(
      `SELECT 
        u1.user_type as manager_role,
        u2.user_type as target_role,
        u2.created_by,
        u2.parent_id
       FROM users u1
       CROSS JOIN users u2
       WHERE u1.user_id = ? AND u2.user_id = ?`,
      [managerId, targetUserId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const { manager_role, target_role, created_by, parent_id } = result.rows[0];

    // Owner can manage anyone
    if (manager_role === 'owner') {
      return true;
    }

    // Super admin can manage everyone except owner
    if (manager_role === 'super_admin' && target_role !== 'owner') {
      return true;
    }

    // Check if manager created this user
    if (created_by === managerId) {
      return true;
    }

    // Check if manager is in the hierarchy (parent)
    if (parent_id === managerId) {
      return true;
    }

    // Check role hierarchy level
    const managerLevel = ROLE_HIERARCHY[manager_role] || 0;
    const targetLevel = ROLE_HIERARCHY[target_role] || 0;

    return managerLevel > targetLevel;
  } catch (error) {
    console.error('Error checking user management permission:', error);
    return false;
  }
};

// Middleware to verify user can manage target user
export const requireManagePermission = async (req, res, next) => {
  const targetUserId = req.params.id || req.body.userId;
  
  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID required' });
  }

  const canManage = await canManageUser(req.user.id, targetUserId);
  
  if (!canManage) {
    return res.status(403).json({ 
      error: 'You do not have permission to manage this user' 
    });
  }

  next();
};
















