-- SQLite Schema for Betting Platform
-- Converted from PostgreSQL schema
-- UUIDs are TEXT, Timestamps are ISO 8601 TEXT, ENUMs are CHECK constraints

-- Users table
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'super_admin', 'admin', 'broker', 'regular_user')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login TEXT,
    broker_id TEXT REFERENCES users(user_id),
    kyc_verified INTEGER DEFAULT 0,
    parent_id TEXT REFERENCES users(user_id),
    created_by TEXT REFERENCES users(user_id)
);

-- Brokers table (extends users)
CREATE TABLE brokers (
    broker_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    rating_score REAL CHECK (rating_score >= 0 AND rating_score <= 5),
    total_users_count INTEGER DEFAULT 0,
    total_transactions_processed INTEGER DEFAULT 0,
    average_payout_time REAL DEFAULT 0,
    commission_rate REAL DEFAULT 0,
    max_exposure_limit INTEGER DEFAULT 0,
    cash_reserve_required INTEGER DEFAULT 0,
    cash_reserve_current INTEGER DEFAULT 0,
    is_accepting_users INTEGER DEFAULT 1,
    created_by TEXT REFERENCES users(user_id),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'))
);

-- Points allocation table
-- Points allocation tracking (full hierarchy support)
CREATE TABLE points_allocation (
    allocation_id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    to_user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    points_allocated INTEGER NOT NULL CHECK (points_allocated > 0),
    points_used INTEGER DEFAULT 0 CHECK (points_used >= 0),
    points_remaining INTEGER NOT NULL CHECK (points_remaining >= 0),
    allocation_date TEXT NOT NULL,
    expiry_date TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- User points table
CREATE TABLE user_points (
    balance_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    current_balance INTEGER DEFAULT 0 CHECK (current_balance >= 0),
    total_purchased INTEGER DEFAULT 0 CHECK (total_purchased >= 0),
    total_used_betting INTEGER DEFAULT 0 CHECK (total_used_betting >= 0),
    total_cashed_out INTEGER DEFAULT 0 CHECK (total_cashed_out >= 0),
    minimum_cashout_threshold INTEGER DEFAULT 1000,
    last_updated TEXT NOT NULL
);

-- Transactions table
CREATE TABLE transactions (
    transaction_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    broker_id TEXT REFERENCES users(user_id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('point_purchase', 'cashout', 'bet_placement', 'bet_win', 'bet_loss', 'broker_allocation', 'refund')),
    points_amount INTEGER NOT NULL,
    cash_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    created_at TEXT NOT NULL,
    processed_at TEXT,
    processed_by TEXT REFERENCES users(user_id)
);

-- Bets table
CREATE TABLE bets (
    bet_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    game_type TEXT NOT NULL,
    bet_amount INTEGER NOT NULL CHECK (bet_amount > 0),
    potential_win INTEGER NOT NULL CHECK (potential_win >= 0),
    actual_result INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
    bet_details TEXT,  -- JSON string
    placed_at TEXT NOT NULL,
    settled_at TEXT
);

-- Cashout requests table
CREATE TABLE cashout_requests (
    request_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    broker_id TEXT NOT NULL REFERENCES users(user_id),
    points_requested INTEGER NOT NULL CHECK (points_requested > 0),
    cash_equivalent REAL NOT NULL CHECK (cash_equivalent > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    requested_at TEXT NOT NULL,
    processed_at TEXT,
    processed_by TEXT REFERENCES users(user_id),
    rejection_reason TEXT,
    payment_method TEXT
);

-- Messages table
CREATE TABLE messages (
    message_id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES users(user_id),
    recipient_id TEXT NOT NULL REFERENCES users(user_id),
    subject TEXT NOT NULL,
    message_content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    sent_at TEXT NOT NULL,
    read_at TEXT,
    message_type TEXT DEFAULT 'general' CHECK (message_type IN ('broker_inquiry', 'support', 'notification', 'general'))
);

-- Broker reviews table
CREATE TABLE broker_reviews (
    review_id TEXT PRIMARY KEY,
    broker_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    payout_speed_rating INTEGER CHECK (payout_speed_rating >= 1 AND payout_speed_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    created_at TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0
);

-- Alerts table
CREATE TABLE alerts (
    alert_id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL REFERENCES users(user_id),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_points', 'cashout_request', 'suspicious_activity', 'system_maintenance')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    expires_at TEXT
);

-- Audit logs table
CREATE TABLE audit_logs (
    log_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    action_type TEXT NOT NULL CHECK (action_type IN ('login', 'logout', 'point_purchase', 'bet_placed', 'cashout', 'user_created', 'broker_switch', 'transaction_created', 'transaction_updated', 'bet_created', 'bet_updated', 'cashout_requested', 'cashout_processed', 'user_updated', 'user_deleted', 'broker_created', 'broker_updated', 'broker_deleted')),
    table_affected TEXT NOT NULL,
    record_id TEXT,
    old_values TEXT,  -- JSON string
    new_values TEXT,  -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    timestamp TEXT NOT NULL
);

-- Fraud alerts table
CREATE TABLE fraud_alerts (
    alert_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    broker_id TEXT REFERENCES users(user_id),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('rapid_betting', 'unusual_pattern', 'multiple_accounts', 'suspicious_cashout')),
    risk_score INTEGER NOT NULL CHECK (risk_score >= 1 AND risk_score <= 100),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    created_at TEXT NOT NULL,
    resolved_at TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_broker_id ON users(broker_id);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_parent_id ON users(parent_id);

CREATE INDEX idx_user_points_user_id ON user_points(user_id);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_broker_id ON transactions(broker_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_placed_at ON bets(placed_at);

CREATE INDEX idx_cashout_requests_user_id ON cashout_requests(user_id);
CREATE INDEX idx_cashout_requests_broker_id ON cashout_requests(broker_id);
CREATE INDEX idx_cashout_requests_status ON cashout_requests(status);

-- Points ledger for complete transaction history
CREATE TABLE IF NOT EXISTS points_ledger (
    ledger_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('allocation_received', 'allocation_given', 'bet_placed', 'bet_won', 'bet_lost', 'cashout', 'refund', 'admin_adjustment')),
    points_change INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    related_allocation_id TEXT REFERENCES points_allocation(allocation_id),
    related_transaction_id TEXT REFERENCES transactions(transaction_id),
    description TEXT,
    created_at TEXT NOT NULL,
    created_by TEXT REFERENCES users(user_id)
);

-- Points requests table
CREATE TABLE IF NOT EXISTS points_requests (
    request_id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    requested_from_id TEXT NOT NULL REFERENCES users(user_id),
    points_requested INTEGER NOT NULL CHECK (points_requested > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    request_message TEXT,
    response_message TEXT,
    created_at TEXT NOT NULL,
    responded_at TEXT,
    responded_by TEXT REFERENCES users(user_id)
);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);

CREATE INDEX idx_broker_reviews_broker_id ON broker_reviews(broker_id);
CREATE INDEX idx_broker_reviews_user_id ON broker_reviews(user_id);

CREATE INDEX idx_alerts_recipient_id ON alerts(recipient_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);

-- Indexes for points system
CREATE INDEX idx_points_allocation_from_user ON points_allocation(from_user_id);
CREATE INDEX idx_points_allocation_to_user ON points_allocation(to_user_id);
CREATE INDEX idx_points_allocation_status ON points_allocation(status);

CREATE INDEX idx_points_ledger_user_id ON points_ledger(user_id);
CREATE INDEX idx_points_ledger_created_at ON points_ledger(created_at);
CREATE INDEX idx_points_ledger_transaction_type ON points_ledger(transaction_type);

CREATE INDEX idx_points_requests_requester ON points_requests(requester_id);
CREATE INDEX idx_points_requests_requested_from ON points_requests(requested_from_id);
CREATE INDEX idx_points_requests_status ON points_requests(status);
