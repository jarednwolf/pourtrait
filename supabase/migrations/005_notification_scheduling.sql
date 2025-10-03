-- Notification Scheduling Migration
-- Adds support for scheduled notifications, delivery tracking, and enhanced preferences

-- Create scheduled_notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('drinking_window', 'recommendation', 'inventory_reminder', 'system')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_delivery_logs table for tracking delivery attempts
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheduled_notification_id UUID REFERENCES scheduled_notifications(id) ON DELETE CASCADE,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('sent', 'failed', 'delivered', 'clicked')),
    delivery_channels JSONB DEFAULT '[]'::jsonb, -- Array of delivery channel results
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_type ON scheduled_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON notification_delivery_logs(scheduled_notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_attempted_at ON notification_delivery_logs(attempted_at);

-- Enable Row Level Security
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled_notifications
CREATE POLICY "Users can view their own scheduled notifications" ON scheduled_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled notifications" ON scheduled_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage all scheduled notifications" ON scheduled_notifications
    FOR ALL USING (true); -- Allow system processes to manage notifications

-- Create RLS policies for notification_delivery_logs
CREATE POLICY "Users can view their own delivery logs" ON notification_delivery_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scheduled_notifications sn 
            WHERE sn.id = scheduled_notification_id 
            AND sn.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage all delivery logs" ON notification_delivery_logs
    FOR ALL USING (true); -- Allow system processes to manage logs

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_notifications_updated_at
    BEFORE UPDATE ON scheduled_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_notifications_updated_at();

-- Update user_profiles to include enhanced notification preferences
DO $$
BEGIN
    -- Check if notification_preferences column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'notification_preferences'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN notification_preferences JSONB DEFAULT '{
            "pushEnabled": true,
            "emailEnabled": true,
            "drinkingWindowAlerts": true,
            "recommendationAlerts": true,
            "inventoryReminders": true,
            "systemAlerts": true,
            "quietHours": {
                "enabled": false,
                "start": "22:00",
                "end": "08:00"
            },
            "frequency": {
                "drinkingWindow": "immediate",
                "recommendations": "daily",
                "inventory": "weekly"
            }
        }'::jsonb;
    ELSE
        -- Update existing notification_preferences to include new fields
        UPDATE user_profiles 
        SET notification_preferences = notification_preferences || '{
            "pushEnabled": true,
            "emailEnabled": true,
            "drinkingWindowAlerts": true,
            "recommendationAlerts": true,
            "inventoryReminders": true,
            "systemAlerts": true,
            "quietHours": {
                "enabled": false,
                "start": "22:00",
                "end": "08:00"
            },
            "frequency": {
                "drinkingWindow": "immediate",
                "recommendations": "daily",
                "inventory": "weekly"
            }
        }'::jsonb
        WHERE notification_preferences IS NULL 
        OR NOT (notification_preferences ? 'pushEnabled');
    END IF;
END $$;

-- Create function to get pending notifications for processing
CREATE OR REPLACE FUNCTION get_pending_notifications(batch_size INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    type TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    payload JSONB,
    attempts INTEGER,
    notification_preferences JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sn.id,
        sn.user_id,
        sn.type,
        sn.scheduled_for,
        sn.payload,
        sn.attempts,
        up.notification_preferences
    FROM scheduled_notifications sn
    JOIN user_profiles up ON up.id = sn.user_id
    WHERE sn.status = 'pending'
    AND sn.scheduled_for <= NOW()
    AND sn.attempts < 3 -- Max 3 retry attempts
    ORDER BY sn.scheduled_for ASC
    LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old notifications and logs
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete delivery logs older than 90 days
    DELETE FROM notification_delivery_logs 
    WHERE attempted_at < NOW() - INTERVAL '90 days';
    
    -- Delete completed notifications older than 30 days
    DELETE FROM scheduled_notifications 
    WHERE status IN ('sent', 'cancelled') 
    AND updated_at < NOW() - INTERVAL '30 days';
    
    -- Delete failed notifications older than 7 days
    DELETE FROM scheduled_notifications 
    WHERE status = 'failed' 
    AND updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get notification statistics for a user
CREATE OR REPLACE FUNCTION get_user_notification_stats(user_uuid UUID)
RETURNS TABLE (
    total_notifications BIGINT,
    sent_notifications BIGINT,
    failed_notifications BIGINT,
    pending_notifications BIGINT,
    cancelled_notifications BIGINT,
    delivery_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_notifications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_notifications,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_notifications,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(
                    (COUNT(CASE WHEN status = 'sent' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
                    2
                )
            ELSE 0 
        END as delivery_rate
    FROM scheduled_notifications
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to schedule drinking window alerts
CREATE OR REPLACE FUNCTION schedule_drinking_window_alerts(
    user_uuid UUID,
    wine_data JSONB,
    alert_type TEXT,
    alert_message TEXT,
    urgency TEXT DEFAULT 'medium',
    schedule_offset_hours INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    scheduled_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate scheduled time
    scheduled_time := NOW() + (schedule_offset_hours || ' hours')::INTERVAL;
    
    -- Insert scheduled notification
    INSERT INTO scheduled_notifications (
        user_id,
        type,
        scheduled_for,
        payload
    ) VALUES (
        user_uuid,
        'drinking_window',
        scheduled_time,
        jsonb_build_object(
            'title', 'Wine Drinking Window Alert',
            'body', alert_message,
            'data', jsonb_build_object(
                'type', 'drinking_window',
                'alertType', alert_type,
                'urgency', urgency,
                'wine', wine_data
            ),
            'tag', 'drinking-window-' || (wine_data->>'id'),
            'requireInteraction', CASE WHEN urgency = 'critical' THEN true ELSE false END
        )
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON scheduled_notifications TO authenticated;
GRANT ALL ON notification_delivery_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_notifications(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notification_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_drinking_window_alerts(UUID, JSONB, TEXT, TEXT, TEXT, INTEGER) TO authenticated;

-- Grant service role permissions for background processing
GRANT ALL ON scheduled_notifications TO service_role;
GRANT ALL ON notification_delivery_logs TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO service_role;

-- Add comments for documentation
COMMENT ON TABLE scheduled_notifications IS 'Stores scheduled notifications for future delivery';
COMMENT ON TABLE notification_delivery_logs IS 'Tracks delivery attempts and results for notifications';
COMMENT ON FUNCTION get_pending_notifications(INTEGER) IS 'Returns pending notifications ready for processing';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Removes old notifications and logs to maintain database performance';
COMMENT ON FUNCTION get_user_notification_stats(UUID) IS 'Returns notification statistics for a user';
COMMENT ON FUNCTION schedule_drinking_window_alerts(UUID, JSONB, TEXT, TEXT, TEXT, INTEGER) IS 'Schedules drinking window alerts for wines';