# Production Runbooks

## Overview

This document contains operational runbooks for managing the Pourtrait production environment. These runbooks provide step-by-step procedures for common operational tasks, incident response, and troubleshooting.

## Table of Contents

1. [Incident Response](#incident-response)
2. [Deployment Procedures](#deployment-procedures)
3. [Database Operations](#database-operations)
4. [Monitoring and Alerting](#monitoring-and-alerting)
5. [Performance Troubleshooting](#performance-troubleshooting)
6. [Security Incidents](#security-incidents)
7. [Backup and Recovery](#backup-and-recovery)
8. [Maintenance Procedures](#maintenance-procedures)

## Incident Response

### Severity Levels

- **P0 (Critical)**: Complete service outage, data loss, security breach
- **P1 (High)**: Major feature unavailable, significant performance degradation
- **P2 (Medium)**: Minor feature issues, moderate performance impact
- **P3 (Low)**: Cosmetic issues, minimal user impact

### P0 - Critical Incident Response

#### Immediate Response (0-15 minutes)

1. **Acknowledge the incident**
   ```bash
   # Check service status
   curl -f https://your-domain.com/health
   
   # Check Vercel deployment status
   vercel ls --token=$VERCEL_TOKEN
   
   # Check Supabase status
   # Visit Supabase dashboard or status page
   ```

2. **Assess impact**
   - Check error rates in monitoring dashboard
   - Verify user reports and support tickets
   - Determine affected functionality

3. **Implement immediate mitigation**
   ```bash
   # Option 1: Rollback to previous deployment
   vercel rollback [previous-deployment-url] --token=$VERCEL_TOKEN
   
   # Option 2: Enable maintenance mode (if configured)
   # Update environment variable MAINTENANCE_MODE=true
   
   # Option 3: Scale down problematic features
   # Disable feature flags in database or environment
   ```

#### Investigation and Resolution (15-60 minutes)

1. **Gather information**
   ```bash
   # Check recent deployments
   vercel ls --token=$VERCEL_TOKEN
   
   # Check error logs
   # Access Vercel dashboard > Functions > Logs
   # Access Supabase dashboard > Logs
   
   # Check performance metrics
   # Review monitoring dashboard
   ```

2. **Identify root cause**
   - Review recent code changes
   - Check external service status
   - Analyze error patterns
   - Review infrastructure changes

3. **Implement fix**
   ```bash
   # Deploy hotfix
   git checkout main
   git pull origin main
   # Make necessary changes
   git add .
   git commit -m "hotfix: resolve critical issue"
   git push origin main
   
   # Monitor deployment
   # Verify fix in production
   ```

#### Post-Incident (1-24 hours)

1. **Verify resolution**
   - Monitor error rates return to normal
   - Confirm all functionality restored
   - Check user feedback

2. **Document incident**
   - Create incident report
   - Document timeline and actions taken
   - Identify lessons learned

3. **Implement preventive measures**
   - Add monitoring/alerting if needed
   - Update runbooks
   - Schedule follow-up improvements

### P1 - High Priority Incident Response

#### Response Procedure (0-30 minutes)

1. **Assess and triage**
   ```bash
   # Check affected services
   curl -f https://your-domain.com/health
   
   # Check specific functionality
   # Test wine inventory, AI recommendations, image processing
   ```

2. **Determine workaround**
   - Identify alternative user paths
   - Communicate workaround to users if needed
   - Implement temporary fixes

3. **Plan resolution**
   - Estimate fix timeline
   - Assign team members
   - Schedule deployment window

## Deployment Procedures

### Standard Deployment

#### Pre-Deployment Checklist

- [ ] All tests passing in CI/CD
- [ ] Code review completed
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Monitoring alerts configured
- [ ] Rollback plan prepared

#### Deployment Steps

1. **Prepare deployment**
   ```bash
   # Ensure main branch is up to date
   git checkout main
   git pull origin main
   
   # Verify build locally
   npm run build
   npm run test
   ```

2. **Deploy to production**
   ```bash
   # Automatic deployment via GitHub Actions
   git push origin main
   
   # Or manual deployment
   vercel --prod --token=$VERCEL_TOKEN
   ```

3. **Post-deployment verification**
   ```bash
   # Health check
   curl -f https://your-domain.com/health
   
   # Smoke tests
   curl -f https://your-domain.com/api/wines
   curl -f https://your-domain.com/api/ai/chat
   
   # Monitor error rates for 30 minutes
   ```

### Emergency Deployment (Hotfix)

#### Hotfix Procedure

1. **Create hotfix branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   ```

2. **Implement minimal fix**
   ```bash
   # Make only necessary changes
   # Avoid refactoring or feature additions
   
   # Test fix locally
   npm run test
   npm run build
   ```

3. **Deploy hotfix**
   ```bash
   git add .
   git commit -m "hotfix: describe critical fix"
   git push origin hotfix/critical-fix
   
   # Create PR and merge immediately
   # Or deploy directly if critical
   vercel --prod --token=$VERCEL_TOKEN
   ```

4. **Post-hotfix cleanup**
   ```bash
   # Merge hotfix to main
   git checkout main
   git merge hotfix/critical-fix
   git push origin main
   
   # Delete hotfix branch
   git branch -d hotfix/critical-fix
   git push origin --delete hotfix/critical-fix
   ```

### Rollback Procedure

#### Automatic Rollback

```bash
# List recent deployments
vercel ls --token=$VERCEL_TOKEN

# Rollback to previous deployment
vercel rollback [deployment-url] --token=$VERCEL_TOKEN

# Verify rollback
curl -f https://your-domain.com/health
```

#### Manual Rollback

```bash
# Find last known good commit
git log --oneline -10

# Create rollback branch
git checkout -b rollback/to-[commit-hash]
git reset --hard [commit-hash]

# Deploy rollback
git push origin rollback/to-[commit-hash] --force
vercel --prod --token=$VERCEL_TOKEN
```

## Database Operations

### Database Migration

#### Pre-Migration Checklist

- [ ] Migration tested in development
- [ ] Backup created
- [ ] Downtime window scheduled (if needed)
- [ ] Rollback plan prepared
- [ ] Team notified

#### Migration Procedure

1. **Create backup**
   ```bash
   # Manual backup
   npx supabase db dump --file backup-$(date +%Y%m%d_%H%M%S).sql
   
   # Verify backup
   ls -la backup-*.sql
   ```

2. **Apply migration**
   ```bash
   # Link to production project
   npx supabase link --project-ref $SUPABASE_PROJECT_REF
   
   # Apply migrations
   npx supabase db push
   
   # Verify migration
   npx supabase migration list
   ```

3. **Verify migration success**
   ```bash
   # Test database connectivity
   curl -f https://your-domain.com/health
   
   # Test affected functionality
   # Run smoke tests
   ```

#### Migration Rollback

```bash
# Restore from backup (if needed)
psql -h [db-host] -U postgres -d postgres -f backup-[timestamp].sql

# Or use Supabase point-in-time recovery
# Access Supabase dashboard > Settings > Database > Point in time recovery
```

### Database Performance Tuning

#### Query Performance Analysis

```sql
-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries taking more than 1 second
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### Performance Optimization

```sql
-- Update table statistics
ANALYZE wines;
ANALYZE user_profiles;
ANALYZE recommendations;

-- Reindex if needed
REINDEX INDEX CONCURRENTLY idx_wines_user_id;

-- Vacuum tables
VACUUM ANALYZE wines;
```

## Monitoring and Alerting

### Health Check Procedures

#### Application Health Check

```bash
# Basic health check
curl -f https://your-domain.com/health

# Detailed health check
curl -s https://your-domain.com/health | jq '.'

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "services": {
#     "database": "healthy",
#     "ai": "healthy",
#     "imageProcessing": "healthy"
#   }
# }
```

#### Database Health Check

```bash
# Check database connectivity
npx supabase status

# Check connection count
psql -h [db-host] -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
psql -h [db-host] -U postgres -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

#### External Services Health Check

```bash
# Check OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check Google Vision API
curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
  https://vision.googleapis.com/v1/images:annotate

# Check email service (Resend)
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/domains
```

### Alert Response Procedures

#### High Error Rate Alert

1. **Immediate assessment**
   ```bash
   # Check current error rate
   curl -s https://your-domain.com/api/monitoring/errors | jq '.'
   
   # Check recent deployments
   vercel ls --token=$VERCEL_TOKEN
   ```

2. **Identify error patterns**
   - Check error logs in Vercel dashboard
   - Review Supabase logs
   - Analyze error categories and frequencies

3. **Mitigation actions**
   ```bash
   # If deployment-related, rollback
   vercel rollback [previous-deployment] --token=$VERCEL_TOKEN
   
   # If external service issue, enable fallbacks
   # Update feature flags or environment variables
   ```

#### High Response Time Alert

1. **Check performance metrics**
   ```bash
   # Check API response times
   curl -s https://your-domain.com/api/monitoring/performance | jq '.'
   
   # Check database performance
   # Review slow query logs
   ```

2. **Identify bottlenecks**
   - Database query performance
   - External API calls
   - Image processing operations
   - AI service response times

3. **Optimization actions**
   ```bash
   # Scale database connections (if needed)
   # Optimize slow queries
   # Enable additional caching
   # Rate limit expensive operations
   ```

## Performance Troubleshooting

### Slow Application Response

#### Diagnosis Steps

1. **Check overall system health**
   ```bash
   curl -s https://your-domain.com/health | jq '.responseTime'
   ```

2. **Identify slow endpoints**
   ```bash
   # Check API response times
   curl -w "@curl-format.txt" -s https://your-domain.com/api/wines
   
   # curl-format.txt content:
   # time_namelookup:  %{time_namelookup}\n
   # time_connect:     %{time_connect}\n
   # time_appconnect:  %{time_appconnect}\n
   # time_pretransfer: %{time_pretransfer}\n
   # time_redirect:    %{time_redirect}\n
   # time_starttransfer: %{time_starttransfer}\n
   # time_total:       %{time_total}\n
   ```

3. **Check database performance**
   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
   
   -- Check long-running queries
   SELECT 
     pid,
     now() - pg_stat_activity.query_start AS duration,
     query 
   FROM pg_stat_activity 
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
   ```

#### Resolution Actions

1. **Database optimization**
   ```sql
   -- Kill long-running queries (if safe)
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE (now() - pg_stat_activity.query_start) > interval '10 minutes';
   
   -- Update statistics
   ANALYZE;
   
   -- Vacuum if needed
   VACUUM ANALYZE;
   ```

2. **Application optimization**
   ```bash
   # Check and clear caches
   # Restart application (redeploy)
   vercel --prod --token=$VERCEL_TOKEN
   
   # Scale resources (if using custom infrastructure)
   ```

### High Memory Usage

#### Diagnosis

```bash
# Check application memory usage
curl -s https://your-domain.com/health | jq '.memory'

# Check database memory usage
psql -h [db-host] -U postgres -c "
  SELECT 
    setting AS max_connections,
    unit
  FROM pg_settings 
  WHERE name = 'max_connections';
"
```

#### Resolution

```bash
# Restart application
vercel --prod --token=$VERCEL_TOKEN

# Optimize database connections
# Review connection pooling settings
# Check for connection leaks in application code
```

## Security Incidents

### Security Breach Response

#### Immediate Response (0-30 minutes)

1. **Contain the breach**
   ```bash
   # Revoke compromised API keys
   # Update environment variables in Vercel
   vercel env rm COMPROMISED_API_KEY --token=$VERCEL_TOKEN
   vercel env add NEW_API_KEY --token=$VERCEL_TOKEN
   
   # Reset database passwords (if needed)
   # Access Supabase dashboard > Settings > Database
   ```

2. **Assess impact**
   - Check access logs
   - Identify compromised data
   - Determine attack vector

3. **Notify stakeholders**
   - Internal team notification
   - User notification (if required)
   - Regulatory notification (if required)

#### Investigation and Recovery (1-24 hours)

1. **Forensic analysis**
   ```bash
   # Review access logs
   # Check Supabase audit logs
   # Analyze application logs
   ```

2. **Implement fixes**
   ```bash
   # Patch security vulnerabilities
   # Update dependencies
   npm audit fix
   
   # Deploy security fixes
   git add .
   git commit -m "security: patch vulnerabilities"
   git push origin main
   ```

3. **Strengthen security**
   - Update security policies
   - Implement additional monitoring
   - Review access controls

### Suspicious Activity Response

#### Detection and Analysis

```bash
# Check for unusual API usage patterns
curl -s https://your-domain.com/api/monitoring/api-usage | jq '.'

# Review authentication logs
# Check Supabase dashboard > Authentication > Logs

# Analyze error patterns
curl -s https://your-domain.com/api/monitoring/errors | jq '.errorsByCategory'
```

#### Response Actions

```bash
# Rate limit suspicious IPs (if possible)
# Block malicious requests at CDN level

# Reset user sessions (if needed)
# Force password resets for affected accounts

# Enable additional logging
# Update monitoring alerts
```

## Backup and Recovery

### Backup Procedures

#### Automated Backup Verification

```bash
# Check Supabase backup status
# Access Supabase dashboard > Settings > Database > Backups

# Verify backup integrity
npx supabase db dump --file test-backup.sql
ls -la test-backup.sql
rm test-backup.sql
```

#### Manual Backup Creation

```bash
# Create full database backup
npx supabase db dump --file manual-backup-$(date +%Y%m%d_%H%M%S).sql

# Create application backup
git archive --format=tar.gz --output=app-backup-$(date +%Y%m%d_%H%M%S).tar.gz HEAD

# Store backups securely
# Upload to secure cloud storage
aws s3 cp manual-backup-*.sql s3://your-backup-bucket/database/
aws s3 cp app-backup-*.tar.gz s3://your-backup-bucket/application/
```

### Recovery Procedures

#### Database Recovery

```bash
# Point-in-time recovery (Supabase Pro)
# Access Supabase dashboard > Settings > Database > Point in time recovery

# Manual restore from backup
psql -h [db-host] -U postgres -d postgres -f backup-file.sql

# Verify recovery
curl -f https://your-domain.com/health
```

#### Application Recovery

```bash
# Rollback to previous deployment
vercel rollback [deployment-url] --token=$VERCEL_TOKEN

# Deploy from backup
git checkout [backup-commit-hash]
vercel --prod --token=$VERCEL_TOKEN

# Verify recovery
curl -f https://your-domain.com/health
```

### Disaster Recovery Testing

#### Monthly DR Test

```bash
#!/bin/bash
# disaster-recovery-test.sh

echo "Starting disaster recovery test..."

# 1. Create test backup
npx supabase db dump --file dr-test-backup.sql

# 2. Simulate failure scenario
echo "Simulating database failure..."

# 3. Test recovery procedures
echo "Testing recovery procedures..."

# 4. Verify recovery
curl -f https://your-domain.com/health

# 5. Document results
echo "DR test completed at $(date)" >> dr-test-log.txt

echo "Disaster recovery test completed"
```

## Maintenance Procedures

### Scheduled Maintenance

#### Pre-Maintenance Checklist

- [ ] Maintenance window scheduled
- [ ] Users notified (if needed)
- [ ] Backup created
- [ ] Rollback plan prepared
- [ ] Team available for support

#### Maintenance Window Procedure

1. **Enable maintenance mode (if configured)**
   ```bash
   # Update environment variable
   vercel env add MAINTENANCE_MODE true --token=$VERCEL_TOKEN
   
   # Deploy maintenance page
   vercel --prod --token=$VERCEL_TOKEN
   ```

2. **Perform maintenance tasks**
   ```bash
   # Database maintenance
   npx supabase db reset --linked  # Only if needed
   
   # Application updates
   git pull origin main
   npm ci
   npm run build
   vercel --prod --token=$VERCEL_TOKEN
   
   # Infrastructure updates
   # Update dependencies, security patches, etc.
   ```

3. **Disable maintenance mode**
   ```bash
   vercel env rm MAINTENANCE_MODE --token=$VERCEL_TOKEN
   vercel --prod --token=$VERCEL_TOKEN
   ```

4. **Post-maintenance verification**
   ```bash
   # Health checks
   curl -f https://your-domain.com/health
   
   # Smoke tests
   # Test critical user journeys
   
   # Monitor for issues
   # Check error rates and performance metrics
   ```

### Database Maintenance

#### Weekly Database Maintenance

```sql
-- Update table statistics
ANALYZE;

-- Check for bloated tables
SELECT 
  schemaname,
  tablename,
  n_dead_tup,
  n_live_tup,
  ROUND(n_dead_tup * 100.0 / (n_live_tup + n_dead_tup), 2) AS dead_percentage
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_percentage DESC;

-- Vacuum tables with high dead tuple percentage
VACUUM ANALYZE wines;
VACUUM ANALYZE user_profiles;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

#### Monthly Database Cleanup

```sql
-- Clean up old monitoring data
SELECT cleanup_monitoring_data();

-- Clean up old notifications
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '90 days' 
AND read = true;

-- Update database statistics
ANALYZE;

-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));
```

### Application Maintenance

#### Dependency Updates

```bash
# Check for outdated dependencies
npm outdated

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Test after updates
npm run test
npm run build

# Deploy updates
git add package*.json
git commit -m "chore: update dependencies"
git push origin main
```

#### Performance Optimization

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for unused dependencies
npx depcheck

# Optimize images
# Review and optimize static assets

# Update caching strategies
# Review and update cache headers
```

## Emergency Contacts

### Internal Team

- **On-Call Engineer**: [Phone/Slack]
- **Database Administrator**: [Phone/Email]
- **Security Team**: [Phone/Email]
- **Product Manager**: [Phone/Email]

### External Services

- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io
- **OpenAI Support**: [Support portal]
- **Google Cloud Support**: [Support portal]

### Escalation Matrix

1. **Level 1**: On-call engineer
2. **Level 2**: Senior engineer + Database admin
3. **Level 3**: Engineering manager + Security team
4. **Level 4**: CTO + External vendor support

## Documentation Updates

This runbook should be updated:

- After each incident (lessons learned)
- When procedures change
- When new services are added
- During quarterly reviews

**Last Updated**: [Date]
**Next Review**: [Date + 3 months]
**Owner**: [Team/Person responsible]