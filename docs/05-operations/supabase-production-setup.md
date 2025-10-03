# Supabase Production Setup Guide

## Overview

This guide covers the complete setup and configuration of Supabase for production deployment, including security policies, performance optimization, and monitoring.

## Production Project Setup

### 1. Create Production Project

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Create new project for production
   - Choose appropriate region (closest to users)
   - Select Pro plan for production features

2. **Project Configuration**
   ```bash
   Project Name: pourtrait-production
   Database Password: [Generate strong password]
   Region: [Select optimal region]
   Plan: Pro (for production features)
   ```

### 2. Database Configuration

#### Connection Settings
```bash
# Production database settings
Max Connections: 100 (Pro plan)
Connection Pooling: Enabled
SSL Mode: Required
```

#### Performance Settings
```sql
-- Optimize for production workload
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

### 3. Security Configuration

#### Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Should return no rows - all tables must have RLS enabled
```

#### API Security Settings

1. **JWT Settings**
   ```bash
   JWT Secret: [Auto-generated, rotate regularly]
   JWT Expiry: 3600 seconds (1 hour)
   Refresh Token Expiry: 604800 seconds (7 days)
   ```

2. **API Rate Limiting**
   ```bash
   Anonymous Requests: 200/hour
   Authenticated Requests: 1000/hour
   ```

3. **CORS Configuration**
   ```json
   {
     "allowed_origins": [
       "https://your-domain.com",
       "https://www.your-domain.com"
     ],
     "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     "allowed_headers": ["authorization", "content-type", "x-client-info"]
   }
   ```

### 4. Authentication Configuration

#### Email Settings
```bash
# Configure SMTP for production emails
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Your Resend API key]
From Email: noreply@your-domain.com
```

#### Social Providers (Optional)
```bash
# Google OAuth
Google Client ID: [Your Google OAuth client ID]
Google Client Secret: [Your Google OAuth client secret]
Redirect URL: https://your-domain.com/auth/callback

# Apple OAuth (for mobile)
Apple Client ID: [Your Apple client ID]
Apple Team ID: [Your Apple team ID]
Apple Key ID: [Your Apple key ID]
Apple Private Key: [Your Apple private key]
```

#### Security Policies
```bash
# Password requirements
Minimum Password Length: 8
Require Uppercase: true
Require Lowercase: true
Require Numbers: true
Require Special Characters: true

# Session settings
Session Timeout: 24 hours
Refresh Token Rotation: Enabled
Multi-factor Authentication: Available
```

## Database Migration to Production

### 1. Migration Process

```bash
# Link to production project
npx supabase link --project-ref your-production-project-ref

# Verify connection
npx supabase status

# Apply all migrations
npx supabase db push

# Verify migrations
npx supabase migration list
```

### 2. Data Seeding (if needed)

```sql
-- Production data seeding script
-- Only run essential data, no test data

-- Insert system configurations
INSERT INTO system_config (key, value) VALUES
('app_version', '1.0.0'),
('maintenance_mode', 'false'),
('feature_flags', '{"ai_recommendations": true, "image_processing": true}');

-- Insert wine regions and appellations
INSERT INTO wine_regions (name, country, type) VALUES
('Bordeaux', 'France', 'region'),
('Burgundy', 'France', 'region'),
('Napa Valley', 'USA', 'region'),
('Tuscany', 'Italy', 'region');
```

### 3. Backup Configuration

```bash
# Enable automated backups
Backup Schedule: Daily at 2 AM UTC
Backup Retention: 7 days (Pro plan)
Point-in-time Recovery: 7 days

# Manual backup process
npx supabase db dump --file production-backup-$(date +%Y%m%d).sql
```

## Security Hardening

### 1. Network Security

```sql
-- Restrict database access to specific IPs (if needed)
-- This is configured in Supabase dashboard under Settings > Database

-- Enable SSL enforcement
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
```

### 2. User Permissions

```sql
-- Create read-only user for analytics
CREATE ROLE analytics_readonly;
GRANT CONNECT ON DATABASE postgres TO analytics_readonly;
GRANT USAGE ON SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;

-- Create backup user
CREATE ROLE backup_user;
GRANT CONNECT ON DATABASE postgres TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

### 3. Audit Logging

```sql
-- Enable audit logging for sensitive operations
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit settings
ALTER SYSTEM SET pgaudit.log = 'write,ddl,role';
ALTER SYSTEM SET pgaudit.log_catalog = off;
ALTER SYSTEM SET pgaudit.log_parameter = on;
SELECT pg_reload_conf();

-- Create audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_wines_trigger
  AFTER INSERT OR UPDATE OR DELETE ON wines
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_user_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Performance Optimization

### 1. Database Indexes

```sql
-- Additional production indexes for performance
CREATE INDEX CONCURRENTLY idx_wines_drinking_window_status 
ON wines ((drinking_window->>'currentStatus'));

CREATE INDEX CONCURRENTLY idx_wines_created_at_desc 
ON wines (created_at DESC);

CREATE INDEX CONCURRENTLY idx_recommendations_created_at_desc 
ON recommendations (created_at DESC);

CREATE INDEX CONCURRENTLY idx_notifications_unread 
ON notifications (user_id, read) WHERE read = false;

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_wines_user_type_vintage 
ON wines (user_id, type, vintage);

CREATE INDEX CONCURRENTLY idx_consumption_user_date 
ON consumption_history (user_id, consumed_at DESC);
```

### 2. Query Optimization

```sql
-- Analyze table statistics
ANALYZE wines;
ANALYZE user_profiles;
ANALYZE recommendations;
ANALYZE consumption_history;

-- Update table statistics automatically
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.2;
```

### 3. Connection Pooling

```typescript
// Configure connection pooling in application
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
  }
)
```

## Monitoring and Alerting

### 1. Database Monitoring

```sql
-- Create monitoring views
CREATE VIEW db_performance_stats AS
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables;

-- Monitor slow queries
CREATE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries taking more than 1 second
ORDER BY mean_time DESC;
```

### 2. Supabase Dashboard Monitoring

Configure alerts in Supabase dashboard:

- **Database CPU Usage**: Alert when > 80%
- **Database Memory Usage**: Alert when > 85%
- **Connection Count**: Alert when > 80 connections
- **Query Performance**: Alert for queries > 5 seconds
- **Error Rate**: Alert when error rate > 5%

### 3. Custom Monitoring

```typescript
// Custom monitoring service
export class DatabaseMonitor {
  static async checkHealth() {
    const supabase = createServerClient()
    
    try {
      // Check connection
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
      
      if (error) throw error
      
      // Check performance
      const { data: slowQueries } = await supabase
        .rpc('get_slow_queries')
      
      return {
        status: 'healthy',
        connectionOk: true,
        slowQueries: slowQueries?.length || 0
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }
}
```

## Backup and Recovery

### 1. Automated Backup Strategy

```bash
# Supabase Pro plan includes:
- Daily automated backups
- 7-day retention period
- Point-in-time recovery
- Cross-region backup replication
```

### 2. Manual Backup Process

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="pourtrait_backup_${DATE}.sql"

# Create backup
npx supabase db dump --file "${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_FILE}"

# Upload to secure storage
aws s3 cp "${BACKUP_FILE}.gz" "s3://your-backup-bucket/database-backups/"

# Clean up local file
rm "${BACKUP_FILE}.gz"

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### 3. Recovery Procedures

```bash
# Point-in-time recovery (Supabase dashboard)
1. Go to Settings > Database
2. Click "Point in time recovery"
3. Select recovery point
4. Confirm recovery

# Manual restore from backup
npx supabase db reset --linked
psql -h your-db-host -U postgres -d postgres -f backup-file.sql
```

## Disaster Recovery Plan

### 1. Recovery Time Objectives (RTO)

- **Database Recovery**: < 4 hours
- **Application Recovery**: < 1 hour
- **Full Service Recovery**: < 6 hours

### 2. Recovery Point Objectives (RPO)

- **Data Loss Tolerance**: < 1 hour
- **Backup Frequency**: Every 6 hours
- **Replication Lag**: < 5 minutes

### 3. Disaster Scenarios

#### Scenario 1: Database Corruption
1. Identify corruption scope
2. Stop application writes
3. Restore from latest backup
4. Verify data integrity
5. Resume operations

#### Scenario 2: Regional Outage
1. Activate backup region
2. Update DNS records
3. Restore from cross-region backup
4. Verify service functionality
5. Monitor performance

#### Scenario 3: Data Breach
1. Immediately revoke compromised credentials
2. Audit access logs
3. Notify affected users
4. Implement additional security measures
5. Document incident response

## Compliance and Security

### 1. GDPR Compliance

```sql
-- Data retention policies
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old audit logs (keep 2 years)
  DELETE FROM audit_log 
  WHERE timestamp < NOW() - INTERVAL '2 years';
  
  -- Anonymize old consumption history (keep 5 years)
  UPDATE consumption_history 
  SET notes = '[REDACTED]'
  WHERE consumed_at < NOW() - INTERVAL '5 years'
  AND notes IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job
SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');
```

### 2. Data Export for Users

```sql
-- User data export function
CREATE OR REPLACE FUNCTION export_user_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (SELECT row_to_json(up) FROM user_profiles up WHERE up.id = user_uuid),
    'taste_profile', (SELECT row_to_json(tp) FROM taste_profiles tp WHERE tp.user_id = user_uuid),
    'wines', (SELECT json_agg(row_to_json(w)) FROM wines w WHERE w.user_id = user_uuid),
    'consumption_history', (SELECT json_agg(row_to_json(ch)) FROM consumption_history ch WHERE ch.user_id = user_uuid),
    'recommendations', (SELECT json_agg(row_to_json(r)) FROM recommendations r WHERE r.user_id = user_uuid)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Data Deletion

```sql
-- Complete user data deletion
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Delete in correct order to respect foreign keys
  DELETE FROM notifications WHERE user_id = user_uuid;
  DELETE FROM recommendations WHERE user_id = user_uuid;
  DELETE FROM consumption_history WHERE user_id = user_uuid;
  DELETE FROM wines WHERE user_id = user_uuid;
  DELETE FROM drinking_partners WHERE user_id = user_uuid;
  DELETE FROM taste_profiles WHERE user_id = user_uuid;
  DELETE FROM user_profiles WHERE id = user_uuid;
  
  -- Log deletion for audit
  INSERT INTO audit_log (action, table_name, record_id, timestamp)
  VALUES ('USER_DELETION', 'user_profiles', user_uuid, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Production Checklist

### Pre-Production

- [ ] Production project created
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Security settings configured
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Performance optimized
- [ ] Audit logging enabled

### Go-Live

- [ ] DNS records updated
- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Health checks passing
- [ ] Monitoring alerts active
- [ ] Backup verification completed
- [ ] Performance baseline established
- [ ] Security scan completed

### Post-Production

- [ ] Monitor performance metrics
- [ ] Verify backup processes
- [ ] Test disaster recovery
- [ ] Review security logs
- [ ] Update documentation
- [ ] Train support team
- [ ] Schedule regular maintenance
- [ ] Plan capacity scaling

## Maintenance Schedule

### Daily
- Monitor performance metrics
- Check error logs
- Verify backup completion
- Review security alerts

### Weekly
- Analyze slow queries
- Review capacity utilization
- Update security patches
- Test backup restoration

### Monthly
- Performance optimization review
- Security audit
- Disaster recovery drill
- Capacity planning review

### Quarterly
- Full security assessment
- Disaster recovery test
- Performance benchmarking
- Documentation updates