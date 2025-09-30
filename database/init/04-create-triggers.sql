-- Create triggers for automatic updates and data consistency

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update user points when transactions are completed
CREATE OR REPLACE FUNCTION update_user_points_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process completed transactions
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update user points based on transaction type
        IF NEW.transaction_type = 'point_purchase' THEN
            UPDATE user_points 
            SET 
                current_balance = current_balance + NEW.points_amount,
                total_purchased = total_purchased + NEW.points_amount,
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id;
            
        ELSIF NEW.transaction_type = 'cashout' THEN
            UPDATE user_points 
            SET 
                current_balance = current_balance - NEW.points_amount,
                total_cashed_out = total_cashed_out + NEW.points_amount,
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id;
            
        ELSIF NEW.transaction_type = 'bet_placement' THEN
            UPDATE user_points 
            SET 
                current_balance = current_balance - NEW.points_amount,
                total_used_betting = total_used_betting + NEW.points_amount,
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id;
            
        ELSIF NEW.transaction_type = 'bet_win' THEN
            UPDATE user_points 
            SET 
                current_balance = current_balance + NEW.points_amount,
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update broker statistics
CREATE OR REPLACE FUNCTION update_broker_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update broker transaction count when transaction is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.broker_id IS NOT NULL THEN
        UPDATE brokers 
        SET total_transactions_processed = total_transactions_processed + 1
        WHERE broker_id = NEW.broker_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_json JSONB;
    new_json JSONB;
    action_type_val action_type_enum;
    record_id_val UUID;
BEGIN
    -- Convert old and new records to JSON
    IF TG_OP = 'DELETE' THEN
        old_json = to_jsonb(OLD);
        new_json = NULL;
        -- Get record ID based on table
        IF TG_TABLE_NAME = 'brokers' THEN
            record_id_val = OLD.broker_id;
        ELSE
            record_id_val = OLD.user_id;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        old_json = NULL;
        new_json = to_jsonb(NEW);
        -- Get record ID based on table
        IF TG_TABLE_NAME = 'brokers' THEN
            record_id_val = NEW.broker_id;
        ELSE
            record_id_val = NEW.user_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        old_json = to_jsonb(OLD);
        new_json = to_jsonb(NEW);
        -- Get record ID based on table
        IF TG_TABLE_NAME = 'brokers' THEN
            record_id_val = NEW.broker_id;
        ELSE
            record_id_val = NEW.user_id;
        END IF;
    END IF;
    
    -- Determine action type based on table and operation
    CASE TG_TABLE_NAME
        WHEN 'users' THEN
            action_type_val := CASE 
                WHEN TG_OP = 'INSERT' THEN 'user_created'::action_type_enum
                WHEN TG_OP = 'UPDATE' THEN 'login'::action_type_enum
                WHEN TG_OP = 'DELETE' THEN 'logout'::action_type_enum
            END;
        WHEN 'transactions' THEN
            action_type_val := CASE 
                WHEN TG_OP = 'INSERT' THEN 'point_purchase'::action_type_enum
                WHEN TG_OP = 'UPDATE' THEN 'cashout'::action_type_enum
                ELSE 'point_purchase'::action_type_enum
            END;
        WHEN 'bets' THEN
            action_type_val := 'bet_placed'::action_type_enum;
        ELSE
            action_type_val := 'login'::action_type_enum;
    END CASE;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        action_type,
        table_affected,
        record_id,
        old_values,
        new_values
    ) VALUES (
        record_id_val,
        action_type_val,
        TG_TABLE_NAME,
        record_id_val,
        old_json,
        new_json
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply triggers to users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- Apply triggers to transactions table
CREATE TRIGGER update_user_points_on_transaction_trigger
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_on_transaction();

CREATE TRIGGER update_broker_stats_trigger
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_broker_stats();

-- Apply triggers to brokers table
CREATE TRIGGER audit_brokers_changes
    AFTER INSERT OR UPDATE OR DELETE ON brokers
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- Apply triggers to bets table
CREATE TRIGGER audit_bets_changes
    AFTER INSERT OR UPDATE OR DELETE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- Apply triggers to cashout_requests table
CREATE TRIGGER audit_cashout_requests_changes
    AFTER INSERT OR UPDATE OR DELETE ON cashout_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();
