#!/bin/bash

# Production Monitoring Script
# Continuous monitoring of production environment health and performance

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/production-monitoring-$(date +%Y%m%d_%H%M%S).log"
BASE_URL="${NEXT_PUBLIC_APP_URL:-https://pourtrait.com}"
MONITORING_INTERVAL="${MONITORING_INTERVAL:-300}" # 5 minutes default
ALERT_THRESHOLD_ERROR_RATE="${ALERT_THRESHOLD_ERROR_RATE:-5}" # 5% error rate
ALERT_THRESHOLD_RESPONSE_TIME="${ALERT_THRESHOLD_RESPONSE_TIME:-5000}" # 5 seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Metrics tracking
declare -A METRICS
METRICS[uptime_checks]=0
METRICS[health_checks]=0
METRICS[performance_checks]=0
METRICS[error_checks]=0
METRICS[alerts_sent]=0

# Function to send alerts
send_alert() {
    local severity="$1"
    local message="$2"
    local details="$3"
    
    log "Sending $severity alert: $message"
    
    # Increment alert counter
    ((METRICS[alerts_sent]++))
    
    # Send Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="warning"
        local emoji="⚠️"
        
        case "$severity" in
            "critical")
                color="danger"
                emoji="🚨"
                ;;
            "high")
                color="danger"
                emoji="❌"
                ;;
            "medium")
                color="warning"
                emoji="⚠️"
                ;;
            "low")
                color="good"
                emoji="ℹ️"
                ;;
        esac
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"$emoji Production Alert: $message\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [
                        {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true},
                        {\"title\": \"Details\", \"value\": \"$details\", \"short\": false},
                        {\"title\": \"URL\", \"value\": \"$BASE_URL\", \"short\": false}
                    ]
                }]
            }" > /dev/null 2>&1
    fi
    
    # Send email notification for critical alerts
    if [ "$severity" = "critical" ] && [ -n "$RESEND_API_KEY" ]; then
        curl -X POST "https://api.resend.com/emails" \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"from\": \"alerts@pourtrait.com\",
                \"to\": [\"ops-team@pourtrait.com\"],
                \"subject\": \"🚨 CRITICAL: Production Alert\",
                \"html\": \"<h2>Critical Production Alert</h2><p><strong>Message:</strong> $message</p><p><strong>Details:</strong> $details</p><p><strong>Time:</strong> $(date)</p><p><strong>URL:</strong> $BASE_URL</p>\"
            }" > /dev/null 2>&1
    fi
}

# Function to check application uptime
check_uptime() {
    log "Checking application uptime..."
    ((METRICS[uptime_checks]++))
    
    local start_time=$(date +%s%N)
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL")
    local end_time=$(date +%s%N)
    local response_time_ms=$(echo "scale=0; ($end_time - $start_time) / 1000000" | bc)
    
    if [ "$response_code" = "200" ]; then
        success "Application is up (${response_time_ms}ms)"
        
        # Check if response time is acceptable
        if [ "$response_time_ms" -gt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
            warning "High response time: ${response_time_ms}ms"
            send_alert "medium" "High response time detected" "Response time: ${response_time_ms}ms (threshold: ${ALERT_THRESHOLD_RESPONSE_TIME}ms)"
        fi
        
        return 0
    else
        error "Application is down (HTTP $response_code)"
        send_alert "critical" "Application is down" "HTTP response code: $response_code"
        return 1
    fi
}

# Function to check detailed health
check_health() {
    log "Checking application health..."
    ((METRICS[health_checks]++))
    
    local health_response=$(curl -s --max-time 15 "$BASE_URL/api/health")
    local health_status=$(echo "$health_response" | jq -r '.status // "unknown"')
    
    case "$health_status" in
        "healthy")
            success "Application health: healthy"
            
            # Check individual services
            local db_status=$(echo "$health_response" | jq -r '.services.database.status // "unknown"')
            local ai_status=$(echo "$health_response" | jq -r '.services.ai.status // "unknown"')
            local image_status=$(echo "$health_response" | jq -r '.services.imageProcessing.status // "unknown"')
            
            if [ "$db_status" != "healthy" ]; then
                warning "Database service is $db_status"
                send_alert "high" "Database service degraded" "Database status: $db_status"
            fi
            
            if [ "$ai_status" != "healthy" ] && [ "$ai_status" != "degraded" ]; then
                warning "AI service is $ai_status"
                send_alert "medium" "AI service issues" "AI service status: $ai_status"
            fi
            
            if [ "$image_status" != "healthy" ] && [ "$image_status" != "degraded" ]; then
                warning "Image processing service is $image_status"
                send_alert "medium" "Image processing issues" "Image processing status: $image_status"
            fi
            
            return 0
            ;;
        "degraded")
            warning "Application health: degraded"
            send_alert "medium" "Application health degraded" "Some services are experiencing issues"
            return 1
            ;;
        "unhealthy")
            error "Application health: unhealthy"
            send_alert "critical" "Application unhealthy" "Critical services are failing"
            return 1
            ;;
        *)
            error "Unable to determine application health"
            send_alert "high" "Health check failed" "Could not retrieve health status"
            return 1
            ;;
    esac
}

# Function to check performance metrics
check_performance() {
    log "Checking performance metrics..."
    ((METRICS[performance_checks]++))
    
    # Check API response times
    local api_endpoints=(
        "/api/health"
        "/api/wines"
        "/api/recommendations/personalized"
    )
    
    local total_response_time=0
    local endpoint_count=0
    local slow_endpoints=()
    
    for endpoint in "${api_endpoints[@]}"; do
        local start_time=$(date +%s%N)
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$endpoint")
        local end_time=$(date +%s%N)
        local response_time_ms=$(echo "scale=0; ($end_time - $start_time) / 1000000" | bc)
        
        if [ "$response_code" = "200" ] || [ "$response_code" = "401" ]; then
            total_response_time=$((total_response_time + response_time_ms))
            ((endpoint_count++))
            
            if [ "$response_time_ms" -gt 3000 ]; then  # 3 second threshold
                slow_endpoints+=("$endpoint:${response_time_ms}ms")
            fi
        else
            warning "Endpoint $endpoint returned HTTP $response_code"
        fi
    done
    
    if [ "$endpoint_count" -gt 0 ]; then
        local avg_response_time=$((total_response_time / endpoint_count))
        log "Average API response time: ${avg_response_time}ms"
        
        if [ "$avg_response_time" -gt 2000 ]; then  # 2 second threshold
            warning "High average response time: ${avg_response_time}ms"
            send_alert "medium" "High API response times" "Average response time: ${avg_response_time}ms"
        fi
        
        if [ ${#slow_endpoints[@]} -gt 0 ]; then
            warning "Slow endpoints detected: ${slow_endpoints[*]}"
            send_alert "low" "Slow endpoints detected" "Endpoints: ${slow_endpoints[*]}"
        fi
    fi
}

# Function to check error rates
check_error_rates() {
    log "Checking error rates..."
    ((METRICS[error_checks]++))
    
    # Get error metrics from monitoring API (if available)
    local monitoring_response=$(curl -s --max-time 10 "$BASE_URL/api/monitoring/dashboard?timeRange=1h" -H "Authorization: Bearer $MONITORING_API_KEY" 2>/dev/null || echo '{}')
    local error_rate=$(echo "$monitoring_response" | jq -r '.data.errors.errorRate // 0')
    local critical_errors=$(echo "$monitoring_response" | jq -r '.data.errors.criticalErrors // 0')
    
    if [ "$error_rate" != "0" ] && [ "$error_rate" != "null" ]; then
        log "Current error rate: ${error_rate}%"
        
        # Check if error rate exceeds threshold
        if (( $(echo "$error_rate > $ALERT_THRESHOLD_ERROR_RATE" | bc -l) )); then
            error "High error rate: ${error_rate}%"
            send_alert "high" "High error rate detected" "Error rate: ${error_rate}% (threshold: ${ALERT_THRESHOLD_ERROR_RATE}%)"
        fi
        
        # Check for critical errors
        if [ "$critical_errors" != "0" ] && [ "$critical_errors" != "null" ]; then
            error "Critical errors detected: $critical_errors"
            send_alert "critical" "Critical errors detected" "Critical error count: $critical_errors"
        fi
    fi
}

# Function to check database performance
check_database_performance() {
    log "Checking database performance..."
    
    # Test database response time via health endpoint
    local start_time=$(date +%s%N)
    local health_response=$(curl -s --max-time 10 "$BASE_URL/api/health")
    local end_time=$(date +%s%N)
    
    local db_response_time=$(echo "$health_response" | jq -r '.services.database.responseTime // 0')
    
    if [ "$db_response_time" != "0" ] && [ "$db_response_time" != "null" ]; then
        log "Database response time: ${db_response_time}ms"
        
        if [ "$db_response_time" -gt 1000 ]; then  # 1 second threshold
            warning "Slow database response: ${db_response_time}ms"
            send_alert "medium" "Slow database performance" "Database response time: ${db_response_time}ms"
        fi
    fi
}

# Function to check SSL certificate
check_ssl_certificate() {
    log "Checking SSL certificate..."
    
    local domain=$(echo "$BASE_URL" | sed 's|https\?://||' | sed 's|/.*||')
    
    # Check SSL certificate expiration
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        log "SSL certificate expires in $days_until_expiry days"
        
        if [ "$days_until_expiry" -lt 30 ]; then
            warning "SSL certificate expires soon: $days_until_expiry days"
            send_alert "medium" "SSL certificate expiring soon" "Certificate expires in $days_until_expiry days"
        fi
        
        if [ "$days_until_expiry" -lt 7 ]; then
            error "SSL certificate expires very soon: $days_until_expiry days"
            send_alert "high" "SSL certificate expiring very soon" "Certificate expires in $days_until_expiry days"
        fi
    else
        warning "Could not check SSL certificate"
    fi
}

# Function to check external service dependencies
check_external_services() {
    log "Checking external service dependencies..."
    
    # Check OpenAI API (if configured)
    if [ -n "$OPENAI_API_KEY" ]; then
        local openai_response=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            "https://api.openai.com/v1/models")
        
        if [ "$openai_response" = "200" ]; then
            success "OpenAI API is accessible"
        else
            warning "OpenAI API returned HTTP $openai_response"
            send_alert "medium" "OpenAI API issues" "HTTP response: $openai_response"
        fi
    fi
    
    # Check Google Vision API (if configured)
    if [ -n "$GOOGLE_VISION_API_KEY" ]; then
        local vision_response=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 \
            "https://vision.googleapis.com/v1/images:annotate?key=$GOOGLE_VISION_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"requests":[]}')
        
        if [ "$vision_response" = "200" ] || [ "$vision_response" = "400" ]; then
            success "Google Vision API is accessible"
        else
            warning "Google Vision API returned HTTP $vision_response"
            send_alert "medium" "Google Vision API issues" "HTTP response: $vision_response"
        fi
    fi
}

# Function to generate monitoring report
generate_report() {
    log "Generating monitoring report..."
    
    local report_file="/tmp/monitoring-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "monitoring_session": {
    "duration_minutes": $(( ($(date +%s) - START_TIME) / 60 )),
    "checks_performed": {
      "uptime_checks": ${METRICS[uptime_checks]},
      "health_checks": ${METRICS[health_checks]},
      "performance_checks": ${METRICS[performance_checks]},
      "error_checks": ${METRICS[error_checks]}
    },
    "alerts_sent": ${METRICS[alerts_sent]}
  },
  "system_status": {
    "overall": "$(check_uptime > /dev/null 2>&1 && echo "healthy" || echo "unhealthy")",
    "last_check": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
    
    log "Monitoring report saved to: $report_file"
    
    # Upload report to monitoring system (if configured)
    if [ -n "$MONITORING_UPLOAD_URL" ]; then
        curl -X POST "$MONITORING_UPLOAD_URL" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $MONITORING_API_KEY" \
            -d @"$report_file" > /dev/null 2>&1
    fi
}

# Function to run single monitoring cycle
run_monitoring_cycle() {
    log "Starting monitoring cycle..."
    
    local cycle_start_time=$(date +%s)
    local checks_passed=0
    local checks_failed=0
    
    # Run all monitoring checks
    if check_uptime; then ((checks_passed++)); else ((checks_failed++)); fi
    if check_health; then ((checks_passed++)); else ((checks_failed++)); fi
    check_performance  # Always runs, doesn't fail
    check_error_rates  # Always runs, doesn't fail
    check_database_performance  # Always runs, doesn't fail
    check_ssl_certificate  # Always runs, doesn't fail
    check_external_services  # Always runs, doesn't fail
    
    local cycle_duration=$(($(date +%s) - cycle_start_time))
    
    log "Monitoring cycle completed in ${cycle_duration}s (Passed: $checks_passed, Failed: $checks_failed)"
    
    # Send summary if there were failures
    if [ "$checks_failed" -gt 0 ]; then
        send_alert "medium" "Monitoring cycle detected issues" "Failed checks: $checks_failed, Passed checks: $checks_passed"
    fi
}

# Function to run continuous monitoring
run_continuous_monitoring() {
    log "Starting continuous monitoring (interval: ${MONITORING_INTERVAL}s)"
    
    while true; do
        run_monitoring_cycle
        
        log "Waiting ${MONITORING_INTERVAL} seconds until next check..."
        sleep "$MONITORING_INTERVAL"
    done
}

# Cleanup function
cleanup() {
    log "Cleaning up monitoring session..."
    generate_report
    log "Monitoring session ended"
}

# Help function
show_help() {
    echo "Production Monitoring Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --url URL           Override base URL for monitoring"
    echo "  -i, --interval SECONDS  Set monitoring interval (default: 300)"
    echo "  -o, --once              Run monitoring once and exit"
    echo "  -c, --continuous        Run continuous monitoring (default)"
    echo "  -v, --verbose           Enable verbose output"
    echo ""
    echo "Environment Variables:"
    echo "  NEXT_PUBLIC_APP_URL           Base URL for the application"
    echo "  SLACK_WEBHOOK_URL             Slack webhook for notifications"
    echo "  RESEND_API_KEY               Email API key for critical alerts"
    echo "  MONITORING_API_KEY           API key for monitoring endpoints"
    echo "  ALERT_THRESHOLD_ERROR_RATE   Error rate threshold (default: 5%)"
    echo "  ALERT_THRESHOLD_RESPONSE_TIME Response time threshold (default: 5000ms)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run continuous monitoring"
    echo "  $0 --once                            # Run single monitoring cycle"
    echo "  $0 --interval 60                     # Monitor every minute"
    echo "  $0 --url https://staging.example.com # Monitor specific URL"
}

# Parse command line arguments
CONTINUOUS_MODE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -i|--interval)
            MONITORING_INTERVAL="$2"
            shift 2
            ;;
        -o|--once)
            CONTINUOUS_MODE=false
            shift
            ;;
        -c|--continuous)
            CONTINUOUS_MODE=true
            shift
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

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Check dependencies
if ! command -v curl &> /dev/null; then
    error "curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    error "jq is required but not installed"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    warning "bc is not installed - some calculations may be limited"
fi

# Initialize
START_TIME=$(date +%s)
log "Production monitoring started"
log "Target URL: $BASE_URL"
log "Monitoring interval: ${MONITORING_INTERVAL}s"
log "Log file: $LOG_FILE"

# Run monitoring
if [ "$CONTINUOUS_MODE" = "true" ]; then
    run_continuous_monitoring
else
    run_monitoring_cycle
fi