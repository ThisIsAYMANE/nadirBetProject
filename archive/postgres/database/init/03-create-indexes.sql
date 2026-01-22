-- Create indexes for optimal query performance

-- Users table indexes
CREATE INDEX idx_users_broker_id ON users(broker_id);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Brokers table indexes
CREATE INDEX idx_brokers_verification_status ON brokers(verification_status);
CREATE INDEX idx_brokers_rating_score ON brokers(rating_score);
CREATE INDEX idx_brokers_created_by ON brokers(created_by);

-- Points allocation indexes
CREATE INDEX idx_points_allocation_broker_id ON points_allocation(broker_id);
CREATE INDEX idx_points_allocation_allocated_by ON points_allocation(allocated_by);
CREATE INDEX idx_points_allocation_date ON points_allocation(allocation_date);

-- User points indexes
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_points_last_updated ON user_points(last_updated);

-- Transactions table indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_broker_id ON transactions(broker_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_processed_at ON transactions(processed_at);

-- Bets table indexes
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_game_type ON bets(game_type);
CREATE INDEX idx_bets_placed_at ON bets(placed_at);
CREATE INDEX idx_bets_settled_at ON bets(settled_at);

-- Cashout requests indexes
CREATE INDEX idx_cashout_requests_user_id ON cashout_requests(user_id);
CREATE INDEX idx_cashout_requests_broker_id ON cashout_requests(broker_id);
CREATE INDEX idx_cashout_requests_status ON cashout_requests(status);
CREATE INDEX idx_cashout_requests_requested_at ON cashout_requests(requested_at);

-- Messages table indexes
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_type ON messages(message_type);

-- Broker reviews indexes
CREATE INDEX idx_broker_reviews_broker_id ON broker_reviews(broker_id);
CREATE INDEX idx_broker_reviews_user_id ON broker_reviews(user_id);
CREATE INDEX idx_broker_reviews_rating ON broker_reviews(rating);
CREATE INDEX idx_broker_reviews_created_at ON broker_reviews(created_at);

-- Alerts table indexes
CREATE INDEX idx_alerts_recipient_id ON alerts(recipient_id);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_table_affected ON audit_logs(table_affected);

-- Fraud alerts indexes
CREATE INDEX idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_broker_id ON fraud_alerts(broker_id);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_type ON fraud_alerts(alert_type);
CREATE INDEX idx_fraud_alerts_risk_score ON fraud_alerts(risk_score);
CREATE INDEX idx_fraud_alerts_created_at ON fraud_alerts(created_at);

-- Additional indexes for views performance
CREATE INDEX idx_transactions_status_created_at ON transactions(status, created_at);
CREATE INDEX idx_users_broker_status ON users(broker_id, status);
CREATE INDEX idx_users_last_login ON users(last_login);
