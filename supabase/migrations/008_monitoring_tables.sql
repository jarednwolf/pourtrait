-- ============================================================================
-- Monitoring and Analytics Tables
-- Migration for production monitoring, analytics, and alerting
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- Analytics Events Table
-- ============================================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL CHECK (length(event_name) > 0 AND length(event_name) <= 100),
  properties JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'production')),
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Performance Metrics Table
-- ============================================================================

CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  value DECIMAL(15,3) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('ms', 'bytes', 'count', 'percentage')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'production')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Error Logs Table
-- ============================================================================

CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL CHECK (length(message) > 0),
  stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'production')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Business Metrics Table
-- ============================================================================

CREATE TABLE business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL CHECK (length(metric_name) > 0 AND length(metric_name) <= 100),
  metric_value DECIMAL(15,3) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'production')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Alerts Table
-- ============================================================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('performance', 'error', 'security', 'business', 'system')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL CHECK (length(message) > 0),
  data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- System Health Table
-- ============================================================================

CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL CHECK (length(service_name) > 0 AND length(service_name) <= 50),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time DECIMAL(10,3),
  error_rate DECIMAL(5,2),
  uptime_percentage DECIMAL(5,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'preview', 'production'))
);

-- ============================================================================
-- User Sessions Table (for analytics)
-- ============================================================================

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Feature Usage Table
-- ============================================================================

CREATE TABLE feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL CHECK (length(feature_name) > 0 AND length(feature_name) <= 100),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 1,
  first_used TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  success_rate DECIMAL(5,2),
  average_duration DECIMAL(10,3),
  metadata JSONB DEFAULT '{}'::jsonb,
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(feature_name, user_id, date)
);

-- ============================================================================
-- API Usage Metrics Table
-- ============================================================================

CREATE TABLE api_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  status_code INTEGER NOT NULL,
  response_time DECIMAL(10,3) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  request_size INTEGER,
  response_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Analytics events indexes
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_environment ON analytics_events(environment);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_name ON performance_metrics(name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_environment ON performance_metrics(environment);

-- Error logs indexes
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_environment ON error_logs(environment);

-- Business metrics indexes
CREATE INDEX idx_business_metrics_name ON business_metrics(metric_name);
CREATE INDEX idx_business_metrics_timestamp ON business_metrics(timestamp DESC);
CREATE INDEX idx_business_metrics_environment ON business_metrics(environment);

-- Alerts indexes
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);

-- System health indexes
CREATE INDEX idx_system_health_service ON system_health(service_name);
CREATE INDEX idx_system_health_status ON system_health(status);
CREATE INDEX idx_system_health_timestamp ON system_health(timestamp DESC);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_start ON user_sessions(session_start DESC);
CREATE INDEX idx_user_sessions_device ON user_sessions(device_type);

-- Feature usage indexes
CREATE INDEX idx_feature_usage_feature ON feature_usage(feature_name);
CREATE INDEX idx_feature_usage_user ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_date ON feature_usage(date DESC);

-- API usage indexes
CREATE INDEX idx_api_usage_endpoint ON api_usage_metrics(endpoint);
CREATE INDEX idx_api_usage_timestamp ON api_usage_metrics(timestamp DESC);
CREATE INDEX idx_api_usage_status ON api_usage_metrics(status_code);
CREATE INDEX idx_api_usage_user ON api_usage_metrics(user_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on monitoring tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Analytics events policies (users can only see their own events)
CREATE POLICY "Users can view own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Performance metrics policies (admin only)
CREATE POLICY "Admin can view performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (preferences->>'role')::text = 'admin'
    )
  );

CREATE POLICY "System can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

-- Error logs policies (admin only)
CREATE POLICY "Admin can view error logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (preferences->>'role')::text = 'admin'
    )
  );

CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Business metrics policies (admin only)
CREATE POLICY "Admin can view business metrics" ON business_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (preferences->>'role')::text = 'admin'
    )
  );

CREATE POLICY "System can insert business metrics" ON business_metrics
  FOR INSERT WITH CHECK (true);

-- Alerts policies (admin only)
CREATE POLICY "Admin can manage alerts" ON alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (preferences->>'role')::text = 'admin'
    )
  );

-- System health policies (admin only)
CREATE POLICY "Admin can view system health" ON system_health
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (preferences->>'role')::text = 'admin'
    )
  );

CREATE POLICY "System can insert system health" ON system_health
  FOR INSERT WITH CHECK (true);

-- User sessions policies (users can see their own sessions)
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage user sessions" ON user_sessions
  FOR ALL WITH CHECK (true);

-- Feature usage policies (users can see their own usage)
CREATE POLICY "Users can view own feature usage" ON feature_usage
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can manage feature usage" ON feature_usage
  FOR ALL WITH CHECK (true);

-- API usage policies (users can see their own API usage)
CREATE POLICY "Users can view own API usage" ON api_usage_metrics
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert API usage" ON api_usage_metrics
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Functions for Monitoring and Analytics
-- ============================================================================

-- Function to calculate error rates
CREATE OR REPLACE FUNCTION calculate_error_rate(
  time_window INTERVAL DEFAULT '1 hour'::INTERVAL
) RETURNS TABLE (
  endpoint TEXT,
  total_requests BIGINT,
  error_requests BIGINT,
  error_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.endpoint,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN a.status_code >= 400 THEN 1 END) as error_requests,
    ROUND(
      (COUNT(CASE WHEN a.status_code >= 400 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
      2
    ) as error_rate
  FROM api_usage_metrics a
  WHERE a.timestamp >= NOW() - time_window
  GROUP BY a.endpoint
  ORDER BY error_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
  time_window INTERVAL DEFAULT '1 hour'::INTERVAL
) RETURNS TABLE (
  metric_name TEXT,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name as metric_name,
    ROUND(AVG(p.value), 2) as avg_value,
    MIN(p.value) as min_value,
    MAX(p.value) as max_value,
    COUNT(*) as count
  FROM performance_metrics p
  WHERE p.timestamp >= NOW() - time_window
  GROUP BY p.name
  ORDER BY avg_value DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get active alerts
CREATE OR REPLACE FUNCTION get_active_alerts()
RETURNS TABLE (
  id UUID,
  type TEXT,
  severity TEXT,
  message TEXT,
  logged_at TIMESTAMPTZ,
  age INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.type,
    a.severity,
    a.message,
    a.timestamp AS logged_at,
    NOW() - a.timestamp as age
  FROM alerts a
  WHERE a.resolved = FALSE
  ORDER BY 
    CASE a.severity 
      WHEN 'critical' THEN 1
      WHEN 'error' THEN 2
      WHEN 'warning' THEN 3
      WHEN 'info' THEN 4
    END,
    a.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS void AS $$
BEGIN
  -- Delete old analytics events (keep 90 days)
  DELETE FROM analytics_events 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Delete old performance metrics (keep 30 days)
  DELETE FROM performance_metrics 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  -- Delete old resolved error logs (keep 30 days)
  DELETE FROM error_logs 
  WHERE resolved = TRUE AND resolved_at < NOW() - INTERVAL '30 days';
  
  -- Delete old business metrics (keep 1 year)
  DELETE FROM business_metrics 
  WHERE timestamp < NOW() - INTERVAL '1 year';
  
  -- Delete old resolved alerts (keep 30 days)
  DELETE FROM alerts 
  WHERE resolved = TRUE AND resolved_at < NOW() - INTERVAL '30 days';
  
  -- Delete old system health records (keep 7 days)
  DELETE FROM system_health 
  WHERE timestamp < NOW() - INTERVAL '7 days';
  
  -- Delete old user sessions (keep 90 days)
  DELETE FROM user_sessions 
  WHERE session_start < NOW() - INTERVAL '90 days';
  
  -- Delete old API usage metrics (keep 30 days)
  DELETE FROM api_usage_metrics 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  -- Vacuum tables to reclaim space
  VACUUM ANALYZE analytics_events;
  VACUUM ANALYZE performance_metrics;
  VACUUM ANALYZE error_logs;
  VACUUM ANALYZE business_metrics;
  VACUUM ANALYZE alerts;
  VACUUM ANALYZE system_health;
  VACUUM ANALYZE user_sessions;
  VACUUM ANALYZE api_usage_metrics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers for Automatic Monitoring
-- ============================================================================

-- Trigger to update session duration when session ends
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_duration_trigger
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION update_session_duration();

-- Trigger to create alerts for critical errors
CREATE OR REPLACE FUNCTION create_alert_for_critical_error()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'critical' THEN
    INSERT INTO alerts (type, severity, message, data, timestamp)
    VALUES (
      'error',
      'critical',
      'Critical error occurred: ' || NEW.message,
      jsonb_build_object(
        'error_id', NEW.id,
        'user_id', NEW.user_id,
        'context', NEW.context
      ),
      NEW.timestamp
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_alert_for_critical_error_trigger
  AFTER INSERT ON error_logs
  FOR EACH ROW EXECUTE FUNCTION create_alert_for_critical_error();

-- ============================================================================
-- Views for Common Monitoring Queries
-- ============================================================================

-- View for real-time system health dashboard
CREATE VIEW system_health_dashboard AS
SELECT 
  service_name,
  status,
  AVG(response_time) as avg_response_time,
  AVG(error_rate) as avg_error_rate,
  AVG(uptime_percentage) as avg_uptime,
  COUNT(*) as health_checks,
  MAX(timestamp) as last_check
FROM system_health
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY service_name, status
ORDER BY service_name;

-- View for error rate trends
CREATE VIEW error_rate_trends AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total_errors,
  COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_errors,
  COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_errors,
  COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_errors,
  COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_errors
FROM error_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- View for performance trends
CREATE VIEW performance_trends AS
SELECT 
  name as metric_name,
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  COUNT(*) as measurements
FROM performance_metrics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY name, DATE_TRUNC('hour', timestamp)
ORDER BY metric_name, hour DESC;

-- View for user activity summary
CREATE VIEW user_activity_summary AS
SELECT 
  DATE_TRUNC('day', timestamp) as day,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_events,
  COUNT(DISTINCT event_name) as unique_events
FROM analytics_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
AND user_id IS NOT NULL
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY day DESC;