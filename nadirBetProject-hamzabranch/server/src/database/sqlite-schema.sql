-- Core users and permissions
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'super_admin', 'admin', 'shop', 'broker', 'regular_user')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login TEXT,
    broker_id TEXT REFERENCES users(user_id),
    kyc_verified INTEGER DEFAULT 0,
    parent_id TEXT REFERENCES users(user_id),
    created_by TEXT REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS brokers (
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

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'EUR',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Points and transactions
CREATE TABLE IF NOT EXISTS points_allocation (
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

CREATE TABLE IF NOT EXISTS user_points (
    balance_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    current_balance INTEGER DEFAULT 0 CHECK (current_balance >= 0),
    total_purchased INTEGER DEFAULT 0 CHECK (total_purchased >= 0),
    total_used_betting INTEGER DEFAULT 0 CHECK (total_used_betting >= 0),
    total_cashed_out INTEGER DEFAULT 0 CHECK (total_cashed_out >= 0),
    minimum_cashout_threshold INTEGER DEFAULT 1000,
    last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
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

CREATE TABLE IF NOT EXISTS cashout_requests (
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

-- Misc tables
CREATE TABLE IF NOT EXISTS messages (
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

CREATE TABLE IF NOT EXISTS broker_reviews (
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

CREATE TABLE IF NOT EXISTS alerts (
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

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(user_id),
    action_type TEXT NOT NULL CHECK (action_type IN ('login', 'logout', 'point_purchase', 'bet_placed', 'cashout', 'user_created', 'broker_switch', 'transaction_created', 'transaction_updated', 'bet_created', 'bet_updated', 'cashout_requested', 'cashout_processed', 'user_updated', 'user_deleted', 'broker_created', 'broker_updated', 'broker_deleted')),
    table_affected TEXT NOT NULL,
    record_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
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

-- Legacy bet table (seems unused but keeping it for safety)
CREATE TABLE IF NOT EXISTS bets (
    bet_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    game_type TEXT NOT NULL,
    bet_amount INTEGER NOT NULL CHECK (bet_amount > 0),
    potential_win INTEGER NOT NULL CHECK (potential_win >= 0),
    actual_result INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
    bet_details TEXT,
    placed_at TEXT NOT NULL,
    settled_at TEXT
);

-- Sports Betting Tables
CREATE TABLE IF NOT EXISTS sports_bets (
    bet_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    broker_id TEXT REFERENCES users(user_id),
    bet_type TEXT NOT NULL CHECK (bet_type IN ('single', 'accumulator', 'system')),
    total_stake INTEGER NOT NULL CHECK (total_stake > 0),
    potential_payout INTEGER NOT NULL CHECK (potential_payout >= 0),
    payout INTEGER DEFAULT 0 CHECK (payout >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void', 'partially_won', 'cancelled')),
    odds_format TEXT DEFAULT 'decimal',
    sport_key TEXT,
    created_at TEXT NOT NULL,
    settled_at TEXT,
    settlement_source TEXT DEFAULT 'auto' CHECK (settlement_source IN ('auto', 'manual'))
);

CREATE TABLE IF NOT EXISTS bet_legs (
    leg_id TEXT PRIMARY KEY,
    bet_id TEXT NOT NULL REFERENCES sports_bets(bet_id) ON DELETE CASCADE,
    sport_key TEXT NOT NULL,
    league TEXT,
    event_id TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    market_type TEXT NOT NULL,
    selection TEXT NOT NULL,
    line TEXT,
    odds_when_placed REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
    commence_time TEXT,
    result_fetched_at TEXT,
    bookmaker_key TEXT
);

CREATE TABLE IF NOT EXISTS odds_cache (
    cache_key TEXT PRIMARY KEY,
    sport_key TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_bet_combinations (
    combination_id TEXT PRIMARY KEY,
    bet_id TEXT NOT NULL REFERENCES sports_bets(bet_id) ON DELETE CASCADE,
    legs_json TEXT NOT NULL,
    stake INTEGER NOT NULL CHECK (stake >= 0),
    potential_win INTEGER NOT NULL CHECK (potential_win >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void'))
);

CREATE TABLE IF NOT EXISTS bet_limits (
    limit_id TEXT PRIMARY KEY,
    role_type TEXT NOT NULL,
    broker_id TEXT REFERENCES users(user_id),
    min_stake INTEGER DEFAULT 1 CHECK (min_stake >= 0),
    max_stake INTEGER DEFAULT 1000000 CHECK (max_stake >= 0),
    max_payout INTEGER DEFAULT 10000000 CHECK (max_payout >= 0),
    max_legs_in_accumulator INTEGER DEFAULT 10 CHECK (max_legs_in_accumulator >= 1),
    max_bets_per_day INTEGER DEFAULT 100 CHECK (max_bets_per_day >= 1),
    allowed_markets TEXT,
    is_active INTEGER DEFAULT 1
);

-- Casino Tables
CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    session_token TEXT NOT NULL,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    initial_balance INTEGER NOT NULL,
    total_bet INTEGER DEFAULT 0,
    total_win INTEGER DEFAULT 0,
    session_duration INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recent_games (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    last_played TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

CREATE TABLE IF NOT EXISTS casino_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id TEXT,
    transaction_id TEXT UNIQUE NOT NULL,
    game_uuid TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('balance', 'bet', 'win', 'refund', 'rollback')),
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    round_id TEXT,
    bet_transaction_id TEXT,
    rollback_transactions TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    processed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Pragmatic Play Tables
CREATE TABLE IF NOT EXISTS pragmatic_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    game_id TEXT NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pragmatic_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    external_player_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('bet', 'win', 'refund')),
    reference TEXT UNIQUE NOT NULL,
    round_id TEXT,
    game_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SportMonks Tables
CREATE TABLE IF NOT EXISTS sm_continents (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sm_countries (
    id INTEGER PRIMARY KEY,
    continent_id INTEGER REFERENCES sm_continents(id),
    name TEXT NOT NULL,
    image_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sm_leagues (
    id INTEGER PRIMARY KEY,
    country_id INTEGER REFERENCES sm_countries(id),
    name TEXT NOT NULL,
    active INTEGER DEFAULT 0,
    type TEXT,
    image_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sm_teams (
    id INTEGER PRIMARY KEY,
    country_id INTEGER REFERENCES sm_countries(id),
    venue_id INTEGER,
    name TEXT NOT NULL,
    short_code TEXT,
    image_path TEXT,
    founded INTEGER,
    type TEXT,
    gender TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sm_markets (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sm_bookmakers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_broker_id ON users(broker_id);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_broker_id ON transactions(broker_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_placed_at ON bets(placed_at);
CREATE INDEX IF NOT EXISTS idx_cashout_requests_user_id ON cashout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cashout_requests_broker_id ON cashout_requests(broker_id);
CREATE INDEX IF NOT EXISTS idx_cashout_requests_status ON cashout_requests(status);
CREATE INDEX IF NOT EXISTS idx_points_allocation_from_user ON points_allocation(from_user_id);
CREATE INDEX IF NOT EXISTS idx_points_allocation_to_user ON points_allocation(to_user_id);
CREATE INDEX IF NOT EXISTS idx_points_allocation_status ON points_allocation(status);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user_id ON points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created_at ON points_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_transaction_type ON points_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_requests_requester ON points_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_points_requests_requested_from ON points_requests(requested_from_id);
CREATE INDEX IF NOT EXISTS idx_points_requests_status ON points_requests(status);
CREATE INDEX IF NOT EXISTS idx_sports_bets_user_id ON sports_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_bets_status ON sports_bets(status);
CREATE INDEX IF NOT EXISTS idx_sports_bets_created_at ON sports_bets(created_at);
CREATE INDEX IF NOT EXISTS idx_bet_legs_bet_id ON bet_legs(bet_id);
CREATE INDEX IF NOT EXISTS idx_bet_legs_event_id ON bet_legs(event_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_token ON game_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_recent_games_user_id ON recent_games(user_id);
CREATE INDEX IF NOT EXISTS idx_casino_transactions_transaction_id ON casino_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_casino_transactions_user_id ON casino_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_casino_transactions_session_id ON casino_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_sm_countries_continent ON sm_countries(continent_id);
CREATE INDEX IF NOT EXISTS idx_sm_leagues_country ON sm_leagues(country_id);
CREATE INDEX IF NOT EXISTS idx_sm_teams_country ON sm_teams(country_id);

-- Views
CREATE VIEW IF NOT EXISTS user_dashboard_view AS
SELECT 
  u.user_id as id,
  u.user_id,
  u.username,
  u.full_name,
  u.email,
  u.user_type,
  u.status,
  u.created_at,
  u.updated_at,
  u.broker_id,
  b.business_name as broker_name,
  COALESCE(up.current_balance, 0) as balance,
  COALESCE(up.total_purchased, 0) as total_purchased,
  COALESCE(up.total_used_betting, 0) as total_used_betting,
  COALESCE(up.total_cashed_out, 0) as total_cashed_out
FROM users u
LEFT JOIN user_points up ON u.user_id = up.user_id
LEFT JOIN brokers b ON u.broker_id = b.broker_id;

CREATE VIEW IF NOT EXISTS broker_dashboard_view AS
SELECT
  b.broker_id,
  b.business_name,
  b.commission_rate,
  u.status,
  u.created_at,
  u.username,
  u.email,
  u.full_name,
  u.user_type,
  (SELECT COUNT(DISTINCT user_id) FROM users WHERE broker_id = b.broker_id) as total_users_count,
  (SELECT COUNT(DISTINCT t.transaction_id) FROM transactions t INNER JOIN users ub ON t.user_id = ub.user_id WHERE ub.broker_id = b.broker_id) as total_transactions_processed,
  (SELECT COALESCE(SUM(t.cash_amount), 0) FROM transactions t INNER JOIN users ub ON t.user_id = ub.user_id WHERE ub.broker_id = b.broker_id) as total_revenue,
  b.rating_score as performance_score
FROM brokers b
INNER JOIN users u ON b.broker_id = u.user_id;

CREATE VIEW IF NOT EXISTS transaction_dashboard_view AS
SELECT 
  t.transaction_id as id,
  t.transaction_id,
  t.user_id,
  u.full_name as user_name,
  u.email as user_email,
  t.broker_id,
  b.business_name as broker_name,
  t.transaction_type as type,
  t.points_amount as amount,
  t.cash_amount as cash_amount,
  t.status,
  t.description,
  t.created_at as timestamp,
  t.processed_at
FROM transactions t
LEFT JOIN users u ON t.user_id = u.user_id
LEFT JOIN brokers b ON t.broker_id = b.broker_id;

CREATE VIEW IF NOT EXISTS super_admin_kpis AS
SELECT 
  'Total Revenue' as title,
  '$' || ROUND(SUM(cash_amount) / 1000.0, 1) || 'K' as value,
  0 as change,
  'stable' as trend
FROM transactions WHERE status = 'completed'
UNION ALL
SELECT 
  'Active Users' as title,
  CAST(COUNT(*) AS TEXT) as value,
  0 as change,
  'stable' as trend
FROM users WHERE status = 'active'
UNION ALL
SELECT 
  'Active Brokers' as title,
  CAST(COUNT(*) AS TEXT) as value,
  0 as change,
  'stable' as trend
FROM users WHERE user_type IN ('broker', 'shop') AND status = 'active'
UNION ALL
SELECT 
  'Total Transactions' as title,
  CAST(COUNT(*) AS TEXT) as value,
  0 as change,
  'stable' as trend
FROM transactions;
