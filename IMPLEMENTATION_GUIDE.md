# Implementation Guide: Multi-Portal Architecture

This guide provides step-by-step instructions to implement the multi-portal architecture based on the feasibility study.

---

## Phase 1: Access Token System for Admin Portal

### Step 1.1: Create Database Migration

Create the invitation tokens table:

```sql
-- File: database/init/10-create-invitation-tokens.sql

-- Invitation tokens for admin portal access
CREATE TABLE invitation_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(user_id),
    broker_id UUID REFERENCES users(user_id),
    token_type VARCHAR(50) DEFAULT 'admin_access', -- admin_access, broker_invite
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB -- Store additional info like IP, user agent, etc.
);

-- Index for fast token lookup
CREATE INDEX idx_invitation_tokens_token ON invitation_tokens(token);
CREATE INDEX idx_invitation_tokens_status ON invitation_tokens(status) WHERE status = 'active';
CREATE INDEX idx_invitation_tokens_expires ON invitation_tokens(expires_at) WHERE status = 'active';

-- Trigger to automatically expire tokens
CREATE OR REPLACE FUNCTION expire_old_tokens()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invitation_tokens
    SET status = 'expired'
    WHERE status = 'active' 
    AND expires_at < NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run expiration check periodically (you can set up a cron job for this)
-- For now, we'll check on each insert
CREATE TRIGGER check_token_expiration
    BEFORE INSERT ON invitation_tokens
    FOR EACH ROW
    EXECUTE FUNCTION expire_old_tokens();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON invitation_tokens TO admin;

-- Insert comment for documentation
COMMENT ON TABLE invitation_tokens IS 'Secure access tokens for admin portal invitation system';
```

### Step 1.2: Create Admin Access Routes

Create a new route file for access token management:

```javascript
// File: server/src/routes/admin-access.js

import express from 'express';
import crypto from 'crypto';
import { pool } from '../index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate a secure access token
 * POST /api/admin-access/generate-token
 * Requires: super_admin role
 */
router.post('/generate-token', 
  authenticateToken, 
  requireRole(['super_admin']), 
  async (req, res) => {
    const { brokerId, expiresInDays = 7, tokenType = 'admin_access' } = req.body;
    
    try {
      // Validate broker exists if brokerId provided
      if (brokerId) {
        const brokerCheck = await pool.query(
          'SELECT user_id FROM users WHERE user_id = $1 AND user_type = $2',
          [brokerId, 'broker']
        );
        
        if (brokerCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Broker not found' });
        }
      }
      
      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiration
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
      
      // Store in database
      const result = await pool.query(
        `INSERT INTO invitation_tokens 
         (token, created_by, broker_id, token_type, expires_at, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING token_id, token, expires_at`,
        [token, req.user.id, brokerId, tokenType, expiresAt]
      );
      
      // Generate access URL
      const adminUrl = process.env.ADMIN_URL || 'http://localhost:5173';
      const accessUrl = `${adminUrl}?access_token=${token}`;
      
      // Log action
      await pool.query(
        `INSERT INTO audit_logs (user_id, action_type, table_affected, record_id, new_values)
         VALUES ($1, 'token_generated', 'invitation_tokens', $2, $3)`,
        [req.user.id, result.rows[0].token_id, JSON.stringify({ brokerId, tokenType })]
      );
      
      res.json({ 
        success: true, 
        tokenId: result.rows[0].token_id,
        token: result.rows[0].token, 
        accessUrl, 
        expiresAt: result.rows[0].expires_at,
        expiresInDays
      });
    } catch (error) {
      console.error('Error generating access token:', error);
      res.status(500).json({ 
        error: 'Failed to generate access token',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

/**
 * Validate and consume an access token
 * POST /api/admin-access/validate-token
 * Public endpoint (no auth required)
 */
router.post('/validate-token', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  try {
    // Find valid token
    const result = await pool.query(
      `SELECT t.*, u.username, u.email, u.user_type, u.full_name, u.status
       FROM invitation_tokens t
       JOIN users u ON t.broker_id = u.user_id
       WHERE t.token = $1 
       AND t.status = 'active'
       AND t.expires_at > NOW()
       AND t.used_at IS NULL`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }
    
    const tokenData = result.rows[0];
    
    // Check if user is active
    if (tokenData.status !== 'active') {
      return res.status(403).json({ 
        error: 'User account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    
    // Mark token as used
    await pool.query(
      `UPDATE invitation_tokens 
       SET used_at = NOW(), status = 'used'
       WHERE token = $1`,
      [token]
    );
    
    // Generate JWT for session
    const jwt = require('jsonwebtoken');
    const sessionToken = jwt.sign(
      { 
        userId: tokenData.broker_id, 
        role: tokenData.user_type,
        username: tokenData.username
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = $1',
      [tokenData.broker_id]
    );
    
    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, table_affected, record_id, ip_address)
       VALUES ($1, 'login', 'users', $1, $2)`,
      [tokenData.broker_id, req.ip]
    );
    
    res.json({ 
      success: true, 
      sessionToken,
      user: {
        id: tokenData.broker_id,
        username: tokenData.username,
        email: tokenData.email,
        fullName: tokenData.full_name,
        role: tokenData.user_type
      }
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ 
      error: 'Failed to validate token',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * List all access tokens
 * GET /api/admin-access/tokens
 * Requires: super_admin role
 */
router.get('/tokens', 
  authenticateToken, 
  requireRole(['super_admin']), 
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
          t.token_id,
          t.token,
          t.token_type,
          t.status,
          t.created_at,
          t.expires_at,
          t.used_at,
          u.username as broker_username,
          u.email as broker_email,
          creator.username as created_by_username
         FROM invitation_tokens t
         LEFT JOIN users u ON t.broker_id = u.user_id
         LEFT JOIN users creator ON t.created_by = creator.user_id
         ORDER BY t.created_at DESC
         LIMIT 100`
      );
      
      res.json({ 
        success: true, 
        tokens: result.rows 
      });
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ error: 'Failed to fetch tokens' });
    }
});

/**
 * Revoke an access token
 * POST /api/admin-access/revoke-token/:tokenId
 * Requires: super_admin role
 */
router.post('/revoke-token/:tokenId', 
  authenticateToken, 
  requireRole(['super_admin']), 
  async (req, res) => {
    const { tokenId } = req.params;
    
    try {
      const result = await pool.query(
        `UPDATE invitation_tokens 
         SET status = 'revoked'
         WHERE token_id = $1
         RETURNING token_id`,
        [tokenId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      // Log action
      await pool.query(
        `INSERT INTO audit_logs (user_id, action_type, table_affected, record_id)
         VALUES ($1, 'token_revoked', 'invitation_tokens', $2)`,
        [req.user.id, tokenId]
      );
      
      res.json({ 
        success: true, 
        message: 'Token revoked successfully' 
      });
    } catch (error) {
      console.error('Error revoking token:', error);
      res.status(500).json({ error: 'Failed to revoke token' });
    }
});

export default router;
```

### Step 1.3: Register Routes in Server

Update `server/src/index.js`:

```javascript
// Add import
import adminAccessRoutes from './routes/admin-access.js';

// Add route (around line 100, with other routes)
app.use('/api/admin-access', adminAccessRoutes);
```

### Step 1.4: Add Access Guard to Admin Portal

Create auth guard component:

```typescript
// File: src/components/auth/AccessGuard.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AccessGuardProps {
  children: React.ReactNode;
}

export const AccessGuard: React.FC<AccessGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, validateAccessToken } = useAuth();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      // Get token from URL
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('access_token');
      
      // If user is already authenticated, skip token check
      if (isAuthenticated) {
        setChecking(false);
        // Clean URL
        if (accessToken) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        return;
      }
      
      // If no token and not authenticated, show error
      if (!accessToken) {
        setError('Access token required. Please use the link provided by your administrator.');
        setChecking(false);
        return;
      }
      
      // Validate token
      try {
        await validateAccessToken(accessToken);
        setChecking(false);
        // Clean URL after successful validation
        window.history.replaceState({}, '', window.location.pathname);
      } catch (err: any) {
        setError(err.message || 'Invalid or expired access token');
        setChecking(false);
      }
    };
    
    if (!isLoading) {
      checkAccess();
    }
  }, [isAuthenticated, isLoading, validateAccessToken]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/freebet.png" alt="Freebet Logo" className="h-64 w-auto" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green mx-auto mb-4"></div>
          <p className="text-white">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="max-w-md p-8 bg-gray-800 rounded-lg border border-red-500">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
```

### Step 1.5: Update AuthContext

Update `src/contexts/AuthContext.tsx` to add token validation:

```typescript
// Add to AuthContext interface
interface AuthContextType {
  // ... existing properties
  validateAccessToken: (token: string) => Promise<void>;
}

// Add to AuthProvider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ... existing state

  const validateAccessToken = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/admin-access/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token validation failed');
      }

      const data = await response.json();

      // Store session token
      localStorage.setItem('token', data.sessionToken);

      // Set user data
      setUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role
      });
      setIsAuthenticated(true);
      setDashboardType(data.user.role === 'super_admin' ? 'super_admin' : 'broker');
    } catch (error: any) {
      console.error('Token validation error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      // ... existing values
      validateAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Step 1.6: Wrap App with AccessGuard

Update `src/App.tsx`:

```typescript
import { AccessGuard } from './components/auth/AccessGuard';

// ... inside DashboardApp component

if (!isAuthenticated) {
  // Remove the direct LoginForm, use AccessGuard
  return null; // AccessGuard will handle this
}

// ... in main App component
function App() {
  return (
    <AuthProvider>
      <AccessGuard>
        <DashboardApp />
      </AccessGuard>
    </AuthProvider>
  );
}
```

### Step 1.7: Add Token Management UI

Create token management component for super admin:

```typescript
// File: src/components/dashboard/TokenManagement.tsx

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';

interface Token {
  token_id: string;
  token: string;
  token_type: string;
  status: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  broker_username: string;
  broker_email: string;
  created_by_username: string;
}

export const TokenManagement: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [brokerId, setBrokerId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin-access/tokens', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTokens(data.tokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin-access/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          brokerId: brokerId || null,
          expiresInDays: parseInt(expiresInDays)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      setGeneratedUrl(data.accessUrl);
      fetchTokens(); // Refresh list
    } catch (error) {
      console.error('Error generating token:', error);
      alert('Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/api/admin-access/revoke-token/${tokenId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTokens(); // Refresh list
    } catch (error) {
      console.error('Error revoking token:', error);
      alert('Failed to revoke token');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Access Token Management</h1>

      {/* Generate New Token */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Generate New Access Token</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Broker ID (Optional)
            </label>
            <input
              type="text"
              value={brokerId}
              onChange={(e) => setBrokerId(e.target.value)}
              placeholder="Leave empty for any broker"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-accent-green focus:ring-1 focus:ring-accent-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expires In (Days)
            </label>
            <input
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              min="1"
              max="365"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-accent-green focus:ring-1 focus:ring-accent-green"
            />
          </div>

          <button
            onClick={generateToken}
            disabled={generating}
            className="w-full px-4 py-2 bg-accent-green text-primary-green rounded-lg font-semibold hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate Token'}
          </button>

          {generatedUrl && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-500 rounded-lg">
              <p className="text-green-400 font-semibold mb-2">✅ Token Generated!</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-800 text-white text-sm rounded border border-gray-600"
                />
                <button
                  onClick={() => copyToClipboard(generatedUrl)}
                  className="px-4 py-2 bg-accent-green text-primary-green rounded hover:bg-accent-green/90"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Share this URL with the broker. It will expire in {expiresInDays} days and can only be used once.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Token List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Tokens</h2>
        
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : tokens.length === 0 ? (
          <p className="text-gray-400">No tokens generated yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-semibold text-gray-300 pb-3">Broker</th>
                  <th className="text-left text-sm font-semibold text-gray-300 pb-3">Status</th>
                  <th className="text-left text-sm font-semibold text-gray-300 pb-3">Created</th>
                  <th className="text-left text-sm font-semibold text-gray-300 pb-3">Expires</th>
                  <th className="text-left text-sm font-semibold text-gray-300 pb-3">Used</th>
                  <th className="text-right text-sm font-semibold text-gray-300 pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.token_id} className="border-b border-gray-800">
                    <td className="py-3 text-sm">
                      <div className="text-white">{token.broker_username || 'Any Broker'}</div>
                      <div className="text-gray-500 text-xs">{token.broker_email}</div>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        token.status === 'active' ? 'bg-green-900/30 text-green-400' :
                        token.status === 'used' ? 'bg-blue-900/30 text-blue-400' :
                        token.status === 'expired' ? 'bg-gray-900/30 text-gray-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {token.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400">
                      {new Date(token.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-sm text-gray-400">
                      {new Date(token.expires_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-sm text-gray-400">
                      {token.used_at ? new Date(token.used_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 text-right">
                      {token.status === 'active' && (
                        <button
                          onClick={() => revokeToken(token.token_id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
```

---

## Phase 2: User Portal Authentication

### Step 2.1: Create Auth Context for User Portal

```typescript
// File: nadir-user/contexts/AuthContext.tsx

'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  brokerId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Invalid token
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();

      // Store token
      localStorage.setItem('token', data.token);

      // Set user
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...registerData,
          userType: 'regular_user'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();

      // Auto-login after registration
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Step 2.2: Create Login/Register Pages

```typescript
// File: nadir-user/app/login/page.tsx

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/'); // Redirect to home after login
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img src="/freebet.png" alt="Freebet" className="h-32 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-gray-400">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 bg-gray-800 border-gray-700 rounded text-green-500 focus:ring-green-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Remember me
              </label>
            </div>

            <Link href="/forgot-password" className="text-sm text-green-500 hover:text-green-400">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-500 text-black rounded-lg font-semibold hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-green-500 hover:text-green-400 font-semibold">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

### Step 2.3: Create Next.js Middleware

```typescript
// File: nadir-user/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password'];

// Routes that require authentication
const protectedRoutes = ['/casino', '/sports', '/live', '/profile', '/favorites'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = ['/login', '/register'].includes(pathname);

  // Redirect to login if trying to access protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if trying to access auth pages while logged in
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
```

### Step 2.4: Update Root Layout

```typescript
// File: nadir-user/app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import MobileNav from '@/components/layout/MobileNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Freebet - Sports Betting & Casino',
  description: 'Professional sports betting platform with integrated casino',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className={`${inter.className} bg-gray-900 text-white pb-14 lg:pb-0 overflow-x-hidden pt-16 sm:pt-20`}>
        <AuthProvider>
          {children}
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## Testing Checklist

### Phase 1 Testing

- [ ] Generate access token via API
- [ ] Validate token works on admin portal
- [ ] Confirm token expires after use
- [ ] Test expired token rejection
- [ ] Verify revoked tokens don't work
- [ ] Check audit logs are created
- [ ] Test direct access without token (should fail)

### Phase 2 Testing

- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Try accessing protected routes without login (should redirect)
- [ ] Try accessing login page while logged in (should redirect)
- [ ] Test logout functionality
- [ ] Verify token persistence
- [ ] Test "remember me" functionality

---

## Environment Variables

Add these to your `.env` files:

```bash
# Admin Portal URL (for token generation)
ADMIN_URL=http://localhost:5173

# User Portal URL
USER_URL=http://localhost:3002

# API URL
API_URL=http://localhost:3001

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

---

## Next Steps

After completing Phases 1 and 2:

1. **Phase 3:** Set up production deployment with Docker
2. **Phase 4:** Configure domain names and SSL certificates
3. **Phase 5:** Set up monitoring and logging
4. **Phase 6:** Performance optimization and caching

Refer to `FEASIBILITY_STUDY.md` for the complete implementation roadmap.

