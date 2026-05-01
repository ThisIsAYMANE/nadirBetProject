-- Create tables for the betting platform database

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type user_type_enum NOT NULL,
    status user_status_enum DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    broker_id UUID REFERENCES users(user_id),
    kyc_verified BOOLEAN DEFAULT FALSE
);

-- Brokers table (extends users)
CREATE TABLE brokers (
    broker_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    rating_score DECIMAL(2,1) CHECK (rating_score >= 0 AND rating_score <= 5),
    total_users_count INTEGER DEFAULT 0,
    total_transactions_processed BIGINT DEFAULT 0,
    average_payout_time DECIMAL(5,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    max_exposure_limit BIGINT DEFAULT 0,
    cash_reserve_required BIGINT DEFAULT 0,
    cash_reserve_current BIGINT DEFAULT 0,
    is_accepting_users BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(user_id),
    verification_status verification_status_enum DEFAULT 'pending'
);

-- Points allocation table
CREATE TABLE points_allocation (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    allocated_by UUID NOT NULL REFERENCES users(user_id),
    points_allocated BIGINT NOT NULL CHECK (points_allocated > 0),
    points_remaining BIGINT NOT NULL CHECK (points_remaining >= 0),
    allocation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE
);

-- User points table
CREATE TABLE user_points (
    balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    current_balance BIGINT DEFAULT 0 CHECK (current_balance >= 0),
    total_purchased BIGINT DEFAULT 0 CHECK (total_purchased >= 0),
    total_used_betting BIGINT DEFAULT 0 CHECK (total_used_betting >= 0),
    total_cashed_out BIGINT DEFAULT 0 CHECK (total_cashed_out >= 0),
    minimum_cashout_threshold BIGINT DEFAULT 1000,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    broker_id UUID REFERENCES users(user_id),
    transaction_type transaction_type_enum NOT NULL,
    points_amount BIGINT NOT NULL,
    cash_amount DECIMAL(15,2) NOT NULL,
    status transaction_status_enum DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(user_id)
);

-- Bets table
CREATE TABLE bets (
    bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    game_type VARCHAR(100) NOT NULL,
    bet_amount BIGINT NOT NULL CHECK (bet_amount > 0),
    potential_win BIGINT NOT NULL CHECK (potential_win >= 0),
    actual_result BIGINT DEFAULT 0,
    status bet_status_enum DEFAULT 'active',
    bet_details JSONB,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP WITH TIME ZONE
);

-- Cashout requests table
CREATE TABLE cashout_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    broker_id UUID NOT NULL REFERENCES users(user_id),
    points_requested BIGINT NOT NULL CHECK (points_requested > 0),
    cash_equivalent DECIMAL(15,2) NOT NULL CHECK (cash_equivalent > 0),
    status request_status_enum DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(user_id),
    rejection_reason TEXT,
    payment_method VARCHAR(100)
);

-- Messages table
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(user_id),
    recipient_id UUID NOT NULL REFERENCES users(user_id),
    subject VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    message_type message_type_enum DEFAULT 'general'
);

-- Broker reviews table
CREATE TABLE broker_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    payout_speed_rating INTEGER CHECK (payout_speed_rating >= 1 AND payout_speed_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE
);

-- Alerts table
CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(user_id),
    alert_type alert_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority alert_priority_enum DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Audit logs table
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    action_type action_type_enum NOT NULL,
    table_affected VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fraud alerts table
CREATE TABLE fraud_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    broker_id UUID REFERENCES users(user_id),
    alert_type fraud_alert_type_enum NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 1 AND risk_score <= 100),
    description TEXT NOT NULL,
    status fraud_status_enum DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);
