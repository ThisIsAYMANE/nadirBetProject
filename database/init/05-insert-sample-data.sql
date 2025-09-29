-- Insert sample data for testing and development

-- Insert sample users
INSERT INTO users (user_id, username, full_name, email, password_hash, user_type, status, created_at, last_login, kyc_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'superadmin', 'Super Administrator', 'admin@bettingplatform.com', '$2b$10$example_hash_superadmin', 'super_admin', 'active', '2024-01-01 00:00:00+00', '2024-01-20 10:30:00+00', true),
('550e8400-e29b-41d4-a716-446655440002', 'broker1', 'Premium Bets Ltd', 'broker1@premiumbets.com', '$2b$10$example_hash_broker1', 'broker', 'active', '2024-01-02 00:00:00+00', '2024-01-20 09:15:00+00', true),
('550e8400-e29b-41d4-a716-446655440003', 'broker2', 'Global Gaming Co', 'broker2@globalgaming.com', '$2b$10$example_hash_broker2', 'broker', 'active', '2024-01-03 00:00:00+00', '2024-01-20 08:45:00+00', true),
('550e8400-e29b-41d4-a716-446655440004', 'broker3', 'Elite Sports Hub', 'broker3@elitesports.com', '$2b$10$example_hash_broker3', 'broker', 'inactive', '2024-01-04 00:00:00+00', '2024-01-19 16:45:00+00', true),
('550e8400-e29b-41d4-a716-446655440005', 'johnsmith', 'John Smith', 'john.smith@email.com', '$2b$10$example_hash_john', 'regular_user', 'active', '2024-01-15 00:00:00+00', '2024-01-20 10:30:00+00', true),
('550e8400-e29b-41d4-a716-446655440006', 'sarahjohnson', 'Sarah Johnson', 'sarah.j@email.com', '$2b$10$example_hash_sarah', 'regular_user', 'active', '2024-01-10 00:00:00+00', '2024-01-20 09:15:00+00', true),
('550e8400-e29b-41d4-a716-446655440007', 'mikewilson', 'Mike Wilson', 'mike.w@email.com', '$2b$10$example_hash_mike', 'regular_user', 'suspended', '2024-01-08 00:00:00+00', '2024-01-19 16:45:00+00', false),
('550e8400-e29b-41d4-a716-446655440008', 'emmadavis', 'Emma Davis', 'emma.davis@email.com', '$2b$10$example_hash_emma', 'regular_user', 'active', '2024-01-12 00:00:00+00', '2024-01-20 14:20:00+00', true);

-- Update broker assignments for regular users
UPDATE users SET broker_id = '550e8400-e29b-41d4-a716-446655440002' WHERE user_id IN ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006');
UPDATE users SET broker_id = '550e8400-e29b-41d4-a716-446655440003' WHERE user_id IN ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008');

-- Insert broker details
INSERT INTO brokers (broker_id, business_name, rating_score, total_users_count, total_transactions_processed, average_payout_time, commission_rate, max_exposure_limit, cash_reserve_required, cash_reserve_current, is_accepting_users, created_by, verification_status) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'Premium Bets Ltd', 4.7, 1250, 15680, 2.5, 5.0, 1000000, 50000, 75000, true, '550e8400-e29b-41d4-a716-446655440001', 'verified'),
('550e8400-e29b-41d4-a716-446655440003', 'Global Gaming Co', 4.2, 890, 9240, 3.2, 4.5, 750000, 40000, 60000, true, '550e8400-e29b-41d4-a716-446655440001', 'verified'),
('550e8400-e29b-41d4-a716-446655440004', 'Elite Sports Hub', 3.6, 450, 3250, 4.1, 6.0, 500000, 25000, 30000, false, '550e8400-e29b-41d4-a716-446655440001', 'verified');

-- Insert user points
INSERT INTO user_points (user_id, current_balance, total_purchased, total_used_betting, total_cashed_out, minimum_cashout_threshold) VALUES
('550e8400-e29b-41d4-a716-446655440005', 15420, 20000, 3000, 1580, 1000),
('550e8400-e29b-41d4-a716-446655440006', 89350, 100000, 5000, 5650, 1000),
('550e8400-e29b-41d4-a716-446655440007', 5280, 10000, 2000, 2720, 1000),
('550e8400-e29b-41d4-a716-446655440008', 23150, 30000, 4000, 2850, 1000);

-- Insert points allocation
INSERT INTO points_allocation (broker_id, allocated_by, points_allocated, points_remaining, allocation_date, expiry_date) VALUES
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 1000000, 750000, '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 750000, 500000, '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 500000, 200000, '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00');

-- Insert sample transactions
INSERT INTO transactions (user_id, broker_id, transaction_type, points_amount, cash_amount, status, description, created_at, processed_at, processed_by) VALUES
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'point_purchase', 500, 500.00, 'completed', 'Point purchase via credit card', '2024-01-20 10:30:00+00', '2024-01-20 10:30:05+00', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'cashout', 1200, 1200.00, 'pending', 'Cashout request to bank account', '2024-01-20 09:15:00+00', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'bet_placement', 250, 250.00, 'completed', 'Bet placed on football match', '2024-01-20 08:45:00+00', '2024-01-20 08:45:02+00', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'bet_win', 750, 750.00, 'completed', 'Winning bet payout', '2024-01-20 07:20:00+00', '2024-01-20 07:20:03+00', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'broker_allocation', 1000000, 1000000.00, 'completed', 'Initial broker point allocation', '2024-01-01 00:00:00+00', '2024-01-01 00:00:05+00', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'broker_allocation', 750000, 750000.00, 'completed', 'Initial broker point allocation', '2024-01-01 00:00:00+00', '2024-01-01 00:00:05+00', '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample bets
INSERT INTO bets (user_id, game_type, bet_amount, potential_win, actual_result, status, bet_details, placed_at, settled_at) VALUES
('550e8400-e29b-41d4-a716-446655440008', 'Football', 250, 500, 500, 'won', '{"match": "Team A vs Team B", "odds": 2.0, "selection": "Team A Win"}', '2024-01-20 08:45:00+00', '2024-01-20 10:30:00+00'),
('550e8400-e29b-41d4-a716-446655440005', 'Basketball', 100, 200, 0, 'lost', '{"match": "Lakers vs Warriors", "odds": 2.0, "selection": "Lakers Win"}', '2024-01-19 20:00:00+00', '2024-01-19 22:30:00+00'),
('550e8400-e29b-41d4-a716-446655440006', 'Tennis', 500, 1000, 1000, 'won', '{"match": "Player A vs Player B", "odds": 2.0, "selection": "Player A Win"}', '2024-01-19 15:00:00+00', '2024-01-19 17:00:00+00');

-- Insert sample cashout requests
INSERT INTO cashout_requests (user_id, broker_id, points_requested, cash_equivalent, status, requested_at, payment_method) VALUES
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 1200, 1200.00, 'pending', '2024-01-20 09:15:00+00', 'Bank Transfer'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 500, 500.00, 'approved', '2024-01-19 16:00:00+00', 'PayPal');

-- Insert sample messages
INSERT INTO messages (sender_id, recipient_id, subject, message_content, message_type, sent_at) VALUES
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Question about payout', 'When will my cashout be processed?', 'broker_inquiry', '2024-01-20 11:00:00+00'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'Re: Question about payout', 'Your cashout will be processed within 24 hours.', 'broker_inquiry', '2024-01-20 11:30:00+00'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'System Maintenance', 'Scheduled maintenance tonight from 2-4 AM', 'notification', '2024-01-20 12:00:00+00');

-- Insert sample broker reviews
INSERT INTO broker_reviews (broker_id, user_id, rating, review_text, payout_speed_rating, communication_rating, is_verified) VALUES
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 5, 'Excellent service, fast payouts!', 5, 5, true),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 4, 'Good platform, reliable.', 4, 4, true),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 3, 'Average experience, could be better.', 3, 3, true);

-- Insert sample alerts
INSERT INTO alerts (recipient_id, alert_type, title, message, priority, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'system_maintenance', 'Scheduled Maintenance', 'Database maintenance scheduled for tonight at 2 AM', 'medium', '2024-01-20 12:00:00+00'),
('550e8400-e29b-41d4-a716-446655440002', 'cashout_request', 'New Cashout Request', 'User johnsmith requested $1200 cashout', 'high', '2024-01-20 09:15:00+00'),
('550e8400-e29b-41d4-a716-446655440005', 'low_points', 'Low Points Balance', 'Your points balance is below 2000', 'low', '2024-01-20 10:30:00+00');

-- Insert sample fraud alerts
INSERT INTO fraud_alerts (user_id, broker_id, alert_type, risk_score, description, status, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'rapid_betting', 85, 'User placed 15 bets in 5 minutes', 'open', '2024-01-19 18:00:00+00'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'suspicious_cashout', 70, 'Large cashout request from new user', 'investigating', '2024-01-20 09:00:00+00');
