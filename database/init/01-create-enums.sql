-- Create custom enums for the betting platform database
-- Language: PostgreSQL

-- User type enumeration
CREATE TYPE user_type_enum AS ENUM ('super_admin', 'broker', 'regular_user');

-- User status enumeration
CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'suspended');

-- Verification status enumeration
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');

-- Transaction type enumeration
CREATE TYPE transaction_type_enum AS ENUM (
    'point_purchase', 
    'cashout', 
    'bet_placement', 
    'bet_win', 
    'bet_loss', 
    'broker_allocation', 
    'refund'
);

-- Transaction status enumeration
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Bet status enumeration
CREATE TYPE bet_status_enum AS ENUM ('active', 'won', 'lost', 'cancelled');

-- Request status enumeration
CREATE TYPE request_status_enum AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Message type enumeration
CREATE TYPE message_type_enum AS ENUM ('broker_inquiry', 'support', 'notification', 'general');

-- Alert type enumeration
CREATE TYPE alert_type_enum AS ENUM ('low_points', 'cashout_request', 'suspicious_activity', 'system_maintenance');

-- Alert priority enumeration
CREATE TYPE alert_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');

-- Action type enumeration
CREATE TYPE action_type_enum AS ENUM (
    'login', 
    'logout', 
    'point_purchase', 
    'bet_placed', 
    'cashout', 
    'user_created', 
    'broker_switch',
    'transaction_created',
    'transaction_updated',
    'bet_created',
    'bet_updated',
    'cashout_requested',
    'cashout_processed',
    'user_updated',
    'user_deleted',
    'broker_created',
    'broker_updated',
    'broker_deleted'
);

-- Fraud alert type enumeration
CREATE TYPE fraud_alert_type_enum AS ENUM (
    'rapid_betting', 
    'unusual_pattern', 
    'multiple_accounts', 
    'suspicious_cashout'
);

-- Fraud status enumeration
CREATE TYPE fraud_status_enum AS ENUM ('open', 'investigating', 'resolved', 'false_positive');
