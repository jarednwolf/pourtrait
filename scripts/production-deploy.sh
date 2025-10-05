#!/bin/bash

# Production Deployment Script
# This script handles production deployments with proper checks and rollback capabilities

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/deploy-$(date +%Y%m%d_%H%M%S).log"
# Allow overriding health endpoint explicitly; otherwise derive from app URL
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-${NEXT_PUBLIC_APP_URL:-https://pourtrait.com}/health}"
MAX_HEALTH_CHECK_ATTEMPTS=10
HEALTH_CHECK_INTERVAL=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if required environment variables are set
check_environment() {
    log "Checking environment variables..."
    
    local required_vars=(
        "VERCEL_TOKEN"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    success "Environment variables check passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if we're on the main branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        error "Deployment must be from main branch. Current branch: $current_branch"
        exit 1
    fi
    
    # Check if working directory is clean
    if ! git diff-index --quiet HEAD --; then
        error "Working directory is not clean. Please commit or stash changes."
        exit 1
    fi
    
    # Pull latest changes
    log "Pulling latest changes from origin..."
    git pull origin main
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci
    
    # Run tests
    log "Running tests..."
    npm run test
    
    # Type check
    log "Running TypeScript type check..."
    npm run type-check
    
    # Lint check
    log "Running linter..."
    npm run lint
    
    # Build check
    log "Running build check..."
    npm run build
    
    success "Pre-deployment checks passed"
}

# Database migration
run_database_migration() {
    log "Checking for database migrations..."
    
    # Check if there are pending migrations
    if npx supabase migration list | grep -q "pending"; then
        log "Pending migrations found. Running database migration..."
        
        # Create backup before migration
        log "Creating database backup before migration..."
        npx supabase db dump --file "backup-pre-migration-$(date +%Y%m%d_%H%M%S).sql"
        
        # Run migrations
        npx supabase db push
        
        # Verify migration success
        if npx supabase migration list | grep -q "pending"; then
            error "Database migration failed - pending migrations still exist"
            exit 1
        fi
        
        success "Database migration completed successfully"
    else
        log "No pending migrations found"
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    log "Deploying to Vercel production..."
    
    # Get current deployment for potential rollback
    PREVIOUS_DEPLOYMENT=$(vercel ls --token="$VERCEL_TOKEN" | grep production | head -n 1 | awk '{print $1}')
    log "Previous deployment: $PREVIOUS_DEPLOYMENT"
    
    # Deploy to production
    DEPLOYMENT_URL=$(vercel --prod --token="$VERCEL_TOKEN" 2>&1 | grep -o 'https://[^[:space:]]*')
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        error "Failed to get deployment URL from Vercel"
        exit 1
    fi
    
    log "Deployment URL: $DEPLOYMENT_URL"
    echo "$DEPLOYMENT_URL" > /tmp/current-deployment-url
    echo "$PREVIOUS_DEPLOYMENT" > /tmp/previous-deployment-url
    
    success "Deployment to Vercel completed"
}

# Health check
health_check() {
    log "Running health checks..."
    
    local attempt=1
    while [ $attempt -le $MAX_HEALTH_CHECK_ATTEMPTS ]; do
        log "Health check attempt $attempt/$MAX_HEALTH_CHECK_ATTEMPTS"
        
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        if [ $attempt -eq $MAX_HEALTH_CHECK_ATTEMPTS ]; then
            error "Health check failed after $MAX_HEALTH_CHECK_ATTEMPTS attempts"
            return 1
        fi
        
        log "Health check failed, waiting ${HEALTH_CHECK_INTERVAL}s before retry..."
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
}

# Smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
  # Test critical endpoints; allow override via ENDPOINTS env (space-separated)
  local endpoints
  if [ -n "$ENDPOINTS" ]; then
    # shellcheck disable=SC2206
    endpoints=( $ENDPOINTS )
  else
    endpoints=( "/health" "/api/health" "/" )
  fi
    
    for endpoint in "${endpoints[@]}"; do
        local url="${NEXT_PUBLIC_APP_URL}${endpoint}"
        log "Testing endpoint: $url"
        
        if ! curl -f -s "$url" > /dev/null; then
            error "Smoke test failed for endpoint: $endpoint"
            return 1
        fi
    done
    
    # Test database connectivity
    log "Testing database connectivity..."
    local health_response=$(curl -s "$HEALTH_CHECK_URL")
    local db_status=$(echo "$health_response" | jq -r '.services.database // "unknown"')
    
    if [ "$db_status" != "healthy" ]; then
        error "Database health check failed. Status: $db_status"
        return 1
    fi
    
    success "Smoke tests passed"
}

# Rollback function
rollback_deployment() {
    error "Deployment failed. Initiating rollback..."
    
    if [ -f /tmp/previous-deployment-url ]; then
        PREVIOUS_DEPLOYMENT=$(cat /tmp/previous-deployment-url)
        
        if [ -n "$PREVIOUS_DEPLOYMENT" ]; then
            log "Rolling back to previous deployment: $PREVIOUS_DEPLOYMENT"
            vercel rollback "$PREVIOUS_DEPLOYMENT" --token="$VERCEL_TOKEN"
            
            # Wait for rollback to complete
            sleep 30
            
            # Verify rollback
            if health_check; then
                success "Rollback completed successfully"
            else
                error "Rollback failed - manual intervention required"
            fi
        else
            error "No previous deployment found for rollback"
        fi
    else
        error "Previous deployment information not available"
    fi
}

# Post-deployment monitoring
post_deployment_monitoring() {
    log "Starting post-deployment monitoring..."
    
    # Monitor for 5 minutes
    local monitor_duration=300
    local check_interval=30
    local end_time=$(($(date +%s) + monitor_duration))
    
    while [ $(date +%s) -lt $end_time ]; do
        if ! health_check; then
            error "Health check failed during monitoring period"
            return 1
        fi
        
        log "Monitoring... $(( (end_time - $(date +%s)) / 60 )) minutes remaining"
        sleep $check_interval
    done
    
    success "Post-deployment monitoring completed successfully"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    log "Sending deployment notification..."
    
    # Send Slack notification if webhook is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        if [ "$status" != "success" ]; then
            color="danger"
        fi
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Production Deployment $status\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Branch\", \"value\": \"$(git branch --show-current)\", \"short\": true},
                        {\"title\": \"Commit\", \"value\": \"$(git rev-parse --short HEAD)\", \"short\": true},
                        {\"title\": \"Author\", \"value\": \"$(git log -1 --pretty=format:'%an')\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }"
    fi
    
    # Send email notification if configured
    if [ -n "$RESEND_API_KEY" ] && [ "$status" != "success" ]; then
        curl -X POST "https://api.resend.com/emails" \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"from\": \"deployments@pourtrait.com\",
                \"to\": [\"team@pourtrait.com\"],
                \"subject\": \"🚨 Production Deployment $status\",
                \"html\": \"<h2>Production Deployment $status</h2><p>$message</p><p>Check the logs for more details.</p>\"
            }"
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f /tmp/current-deployment-url /tmp/previous-deployment-url
}

# Main deployment function
main() {
    log "Starting production deployment..."
    log "Log file: $LOG_FILE"
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    # Trap to handle rollback on failure
    trap 'rollback_deployment; send_notification "failed" "Deployment failed and was rolled back"; exit 1' ERR
    
    # Run deployment steps
    check_environment
    pre_deployment_checks
    run_database_migration
    deploy_to_vercel
    
    # Disable ERR trap for health checks (we handle failures manually)
    trap - ERR
    
    if ! health_check; then
        rollback_deployment
        send_notification "failed" "Deployment failed health checks and was rolled back"
        exit 1
    fi
    
    if ! run_smoke_tests; then
        rollback_deployment
        send_notification "failed" "Deployment failed smoke tests and was rolled back"
        exit 1
    fi
    
    if ! post_deployment_monitoring; then
        rollback_deployment
        send_notification "failed" "Deployment failed post-deployment monitoring and was rolled back"
        exit 1
    fi
    
    success "Production deployment completed successfully!"
    send_notification "success" "Production deployment completed successfully"
    
    # Display deployment summary
    echo ""
    echo "=== Deployment Summary ==="
    echo "Deployment URL: $(cat /tmp/current-deployment-url 2>/dev/null || echo 'Unknown')"
    echo "Health Check: ✅ Passed"
    echo "Smoke Tests: ✅ Passed"
    echo "Monitoring: ✅ Passed"
    echo "Log File: $LOG_FILE"
    echo "=========================="
}

# Help function
show_help() {
    echo "Production Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo ""
    echo "Environment Variables:"
    echo "  VERCEL_TOKEN              Vercel authentication token (required)"
    echo "  NEXT_PUBLIC_SUPABASE_URL  Supabase project URL (required)"
    echo "  SUPABASE_SERVICE_ROLE_KEY Supabase service role key (required)"
    echo "  SLACK_WEBHOOK_URL         Slack webhook for notifications (optional)"
    echo "  RESEND_API_KEY           Resend API key for email notifications (optional)"
    echo ""
    echo "Examples:"
    echo "  $0                        Run production deployment"
    echo "  $0 --verbose             Run with verbose output"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main