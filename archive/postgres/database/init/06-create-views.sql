-- Create useful views for dashboard queries

-- View for user dashboard data (combines users with their points)
CREATE VIEW user_dashboard_view AS
SELECT 
    u.user_id as id,
    COALESCE(u.full_name, u.username) as name,
    u.email,
    u.user_type as role,
    u.status,
    u.created_at,
    u.last_login,
    u.kyc_verified,
    u.broker_id,
    COALESCE(up.current_balance, 0) as total_points,
    COALESCE(up.total_purchased, 0) as total_purchased,
    COALESCE(up.total_used_betting, 0) as total_used_betting,
    COALESCE(up.total_cashed_out, 0) as total_cashed_out,
    COALESCE(up.minimum_cashout_threshold, 1000) as minimum_cashout_threshold,
    up.last_updated as points_last_updated
FROM users u
LEFT JOIN user_points up ON u.user_id = up.user_id;

-- View for broker dashboard data (combines brokers with user counts and revenue)
CREATE VIEW broker_dashboard_view AS
SELECT 
    b.broker_id,
    u.username,
    u.email,
    b.business_name,
    u.status,
    b.rating_score,
    b.total_users_count,
    b.total_transactions_processed,
    b.average_payout_time,
    b.commission_rate,
    b.max_exposure_limit,
    b.cash_reserve_required,
    b.cash_reserve_current,
    b.is_accepting_users,
    b.verification_status,
    u.created_at,
    u.last_login,
    -- Calculate performance score based on various factors
    CASE 
        WHEN b.rating_score >= 4.5 AND b.average_payout_time <= 3.0 AND b.total_transactions_processed > 1000 THEN 95
        WHEN b.rating_score >= 4.0 AND b.average_payout_time <= 4.0 AND b.total_transactions_processed > 500 THEN 85
        WHEN b.rating_score >= 3.5 AND b.average_payout_time <= 5.0 AND b.total_transactions_processed > 100 THEN 75
        ELSE 65
    END as performance_score,
    -- Calculate total revenue from completed transactions
    COALESCE((
        SELECT SUM(cash_amount) 
        FROM transactions t 
        WHERE t.broker_id = b.broker_id 
        AND t.status = 'completed'
    ), 0) as total_revenue
FROM brokers b
JOIN users u ON b.broker_id = u.user_id;

-- View for transaction dashboard data (combines transactions with user and broker info)
CREATE VIEW transaction_dashboard_view AS
SELECT 
    t.transaction_id as id,
    t.user_id,
    u.username as user_name,
    u.email as user_email,
    t.broker_id,
    b.business_name as broker_name,
    -- Map database transaction types to dashboard types
    CASE 
        WHEN t.transaction_type = 'point_purchase' THEN 'deposit'
        WHEN t.transaction_type = 'cashout' THEN 'withdrawal'
        WHEN t.transaction_type = 'bet_placement' THEN 'bet'
        WHEN t.transaction_type = 'bet_win' THEN 'win'
        WHEN t.transaction_type = 'bet_loss' THEN 'bet'
        WHEN t.transaction_type = 'broker_allocation' THEN 'deposit'
        WHEN t.transaction_type = 'refund' THEN 'deposit'
        ELSE t.transaction_type::text
    END as type,
    t.points_amount as points,
    t.cash_amount as amount,
    t.status,
    t.description,
    t.created_at as timestamp,
    t.processed_at,
    processed_by_user.username as processed_by_name
FROM transactions t
JOIN users u ON t.user_id = u.user_id
LEFT JOIN brokers b ON t.broker_id = b.broker_id
LEFT JOIN users processed_by_user ON t.processed_by = processed_by_user.user_id;

-- View for KPI calculations (Super Admin) - Simplified version
CREATE VIEW super_admin_kpis AS
WITH monthly_revenue AS (
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(cash_amount) as revenue
    FROM transactions 
    WHERE status = 'completed'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
    LIMIT 2
),
revenue_comparison AS (
    SELECT 
        (SELECT revenue FROM monthly_revenue LIMIT 1) as current_revenue,
        (SELECT revenue FROM monthly_revenue OFFSET 1 LIMIT 1) as previous_revenue
)
SELECT 
    'Total Revenue' as title,
    CONCAT('$', ROUND(current_revenue / 1000000, 1), 'M') as value,
    ROUND(
        CASE 
            WHEN previous_revenue > 0 THEN 
                ((current_revenue - previous_revenue) / previous_revenue * 100)
            ELSE 0 
        END, 1
    ) as change_percentage,
    CASE 
        WHEN previous_revenue > 0 AND current_revenue > previous_revenue THEN 'up'
        WHEN previous_revenue > 0 AND current_revenue < previous_revenue THEN 'down'
        ELSE 'stable'
    END as trend
FROM revenue_comparison;

-- View for monthly revenue chart data
CREATE VIEW monthly_revenue_chart AS
SELECT 
    TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as name,
    SUM(cash_amount) as value,
    DATE_TRUNC('month', created_at) as month_date
FROM transactions 
WHERE status = 'completed'
    AND created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month_date;

-- View for broker performance metrics
CREATE VIEW broker_performance_metrics AS
SELECT 
    b.broker_id,
    b.business_name,
    b.rating_score,
    b.total_users_count,
    b.total_transactions_processed,
    b.average_payout_time,
    -- Calculate success rate
    ROUND(
        (COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / 
         NULLIF(COUNT(t.transaction_id), 0)), 1
    ) as success_rate,
    -- Calculate monthly revenue
    COALESCE(SUM(CASE 
        WHEN t.created_at >= CURRENT_DATE - INTERVAL '1 month' 
        AND t.status = 'completed' 
        THEN t.cash_amount 
        ELSE 0 
    END), 0) as monthly_revenue,
    -- Calculate active users (logged in last 30 days)
    (SELECT COUNT(*) 
     FROM users u 
     WHERE u.broker_id = b.broker_id 
     AND u.last_login >= CURRENT_DATE - INTERVAL '30 days'
     AND u.status = 'active') as active_users_count,
    -- Calculate pending cashouts
    (SELECT COUNT(*) 
     FROM cashout_requests cr 
     WHERE cr.broker_id = b.broker_id 
     AND cr.status = 'pending') as pending_cashouts
FROM brokers b
LEFT JOIN transactions t ON b.broker_id = t.broker_id
GROUP BY b.broker_id, b.business_name, b.rating_score, b.total_users_count, 
         b.total_transactions_processed, b.average_payout_time;

-- View for fraud monitoring
CREATE VIEW fraud_monitoring_view AS
SELECT 
    fa.alert_id,
    u.username as user_name,
    b.business_name as broker_name,
    fa.alert_type,
    fa.risk_score,
    fa.description,
    fa.status,
    fa.created_at,
    fa.resolved_at,
    CASE 
        WHEN fa.risk_score >= 90 THEN 'critical'
        WHEN fa.risk_score >= 70 THEN 'high'
        WHEN fa.risk_score >= 50 THEN 'medium'
        ELSE 'low'
    END as risk_level
FROM fraud_alerts fa
JOIN users u ON fa.user_id = u.user_id
LEFT JOIN brokers b ON fa.broker_id = b.broker_id
ORDER BY fa.risk_score DESC, fa.created_at DESC;
