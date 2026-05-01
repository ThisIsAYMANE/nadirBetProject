-- Pragmatic Play Integration Tables

-- Pragmatic Sessions Table
-- Stores game session tokens for players
CREATE TABLE IF NOT EXISTS pragmatic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    game_id VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pragmatic Transactions Table
-- Stores all transactions (bets, wins, refunds, bonuses, jackpots)
CREATE TABLE IF NOT EXISTS pragmatic_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    external_player_id VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('bet', 'win', 'refund', 'bonus', 'jackpot')),
    reference VARCHAR(255) UNIQUE NOT NULL,
    round_id VARCHAR(255),
    game_id VARCHAR(100),
    amount BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pragmatic_sessions_token ON pragmatic_sessions(token);
CREATE INDEX IF NOT EXISTS idx_pragmatic_sessions_player_id ON pragmatic_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_pragmatic_sessions_status ON pragmatic_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pragmatic_transactions_reference ON pragmatic_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_pragmatic_transactions_player_id ON pragmatic_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_pragmatic_transactions_round_id ON pragmatic_transactions(round_id);
CREATE INDEX IF NOT EXISTS idx_pragmatic_transactions_game_id ON pragmatic_transactions(game_id);
CREATE INDEX IF NOT EXISTS idx_pragmatic_transactions_created_at ON pragmatic_transactions(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pragmatic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_pragmatic_sessions_updated_at
    BEFORE UPDATE ON pragmatic_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_pragmatic_updated_at();

CREATE TRIGGER update_pragmatic_transactions_updated_at
    BEFORE UPDATE ON pragmatic_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_pragmatic_updated_at();


