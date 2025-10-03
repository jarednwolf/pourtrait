#!/bin/bash

# Automated Service Setup Script
# Configures all possible services via CLI/SDK and provides instructions for manual setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required CLIs are installed
check_dependencies() {
    log "Checking required CLI tools..."
    
    local missing_tools=()
    
    # Check for Supabase CLI
    if ! command -v supabase &> /dev/null; then
        missing_tools+=("supabase")
    fi
    
    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        missing_tools+=("vercel")
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install the missing tools:"
        echo "- Supabase CLI: npm install -g supabase"
        echo "- Vercel CLI: npm install -g vercel"
        echo "- Node.js: https://nodejs.org/"
        exit 1
    fi
    
    success "All required CLI tools are installed"
}

# Setup Supabase project
setup_supabase() {
    log "Setting up Supabase project..."
    
    echo ""
    echo "🚀 Supabase Setup"
    echo "=================="
    
    # Login to Supabase
    log "Logging into Supabase..."
    supabase login
    
    # Create new project or link existing
    echo ""
    read -p "Do you want to (c)reate a new Supabase project or (l)ink to existing? [c/l]: " choice
    
    if [ "$choice" = "c" ]; then
        read -p "Enter project name: " project_name
        read -p "Enter database password: " -s db_password
        echo ""
        read -p "Enter organization ID (or press Enter for default): " org_id
        
        if [ -n "$org_id" ]; then
            supabase projects create "$project_name" --db-password "$db_password" --org-id "$org_id"
        else
            supabase projects create "$project_name" --db-password "$db_password"
        fi
    else
        read -p "Enter project reference ID: " project_ref
        supabase link --project-ref "$project_ref"
    fi
    
    # Get project details
    log "Getting project details..."
    supabase status
    
    # Run migrations
    log "Running database migrations..."
    supabase db push
    
    # Get project URL and keys
    local project_url=$(supabase status | grep "API URL" | awk '{print $3}')
    local anon_key=$(supabase status | grep "anon key" | awk '{print $3}')
    local service_key=$(supabase status | grep "service_role key" | awk '{print $3}')
    
    # Store in temporary file for later use
    cat > /tmp/supabase_config << EOF
NEXT_PUBLIC_SUPABASE_URL=$project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon_key
SUPABASE_SERVICE_ROLE_KEY=$service_key
EOF
    
    success "Supabase project configured successfully"
}

# Setup Vercel project
setup_vercel() {
    log "Setting up Vercel project..."
    
    echo ""
    echo "🚀 Vercel Setup"
    echo "==============="
    
    # Login to Vercel
    log "Logging into Vercel..."
    vercel login
    
    # Link project
    log "Linking Vercel project..."
    vercel link
    
    # Get project details
    local project_info=$(vercel project ls --format json | jq -r '.[0]')
    local project_id=$(echo "$project_info" | jq -r '.id')
    local org_id=$(echo "$project_info" | jq -r '.accountId')
    
    # Store in temporary file
    cat > /tmp/vercel_config << EOF
VERCEL_PROJECT_ID=$project_id
VERCEL_ORG_ID=$org_id
EOF
    
    success "Vercel project configured successfully"
}

# Generate secrets
generate_secrets() {
    log "Generating application secrets..."
    
    # Generate random secrets
    local nextauth_secret=$(openssl rand -base64 32)
    local jwt_secret=$(openssl rand -base64 32)
    local cron_secret=$(openssl rand -base64 32)
    
    cat > /tmp/app_secrets << EOF
NEXTAUTH_SECRET=$nextauth_secret
JWT_SECRET=$jwt_secret
CRON_SECRET=$cron_secret
EOF
    
    success "Application secrets generated"
}

# Setup VAPID keys for push notifications
setup_vapid_keys() {
    log "Generating VAPID keys for push notifications..."
    
    # Install web-push if not available
    if ! npm list -g web-push &> /dev/null; then
        log "Installing web-push CLI..."
        npm install -g web-push
    fi
    
    # Generate VAPID keys
    local vapid_keys=$(web-push generate-vapid-keys --json)
    local public_key=$(echo "$vapid_keys" | jq -r '.publicKey')
    local private_key=$(echo "$vapid_keys" | jq -r '.privateKey')
    
    read -p "Enter your email for VAPID subject: " vapid_email
    
    cat > /tmp/vapid_config << EOF
VAPID_PUBLIC_KEY=$public_key
VAPID_PRIVATE_KEY=$private_key
VAPID_SUBJECT=mailto:$vapid_email
EOF
    
    success "VAPID keys generated successfully"
}

# Combine all configurations
create_env_file() {
    log "Creating .env.local file..."
    
    # Start with the template
    cp .env.local.example .env.local
    
    # Read domain from user
    read -p "Enter your domain (e.g., https://your-app.vercel.app): " app_url
    
    # Update basic app configuration
    sed -i.bak "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=$app_url|" .env.local
    sed -i.bak "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=$app_url|" .env.local
    
    # Merge configurations if they exist
    if [ -f /tmp/supabase_config ]; then
        while IFS= read -r line; do
            key=$(echo "$line" | cut -d'=' -f1)
            value=$(echo "$line" | cut -d'=' -f2-)
            sed -i.bak "s|$key=.*|$line|" .env.local
        done < /tmp/supabase_config
    fi
    
    if [ -f /tmp/vercel_config ]; then
        while IFS= read -r line; do
            key=$(echo "$line" | cut -d'=' -f1)
            value=$(echo "$line" | cut -d'=' -f2-)
            sed -i.bak "s|$key=.*|$line|" .env.local
        done < /tmp/vercel_config
    fi
    
    if [ -f /tmp/app_secrets ]; then
        while IFS= read -r line; do
            key=$(echo "$line" | cut -d'=' -f1)
            value=$(echo "$line" | cut -d'=' -f2-)
            sed -i.bak "s|$key=.*|$line|" .env.local
        done < /tmp/app_secrets
    fi
    
    if [ -f /tmp/vapid_config ]; then
        while IFS= read -r line; do
            key=$(echo "$line" | cut -d'=' -f1)
            value=$(echo "$line" | cut -d'=' -f2-)
            sed -i.bak "s|$key=.*|$line|" .env.local
        done < /tmp/vapid_config
    fi
    
    # Clean up backup file
    rm -f .env.local.bak
    
    success ".env.local file created successfully"
}

# Set Vercel environment variables
setup_vercel_env() {
    log "Setting up Vercel environment variables..."
    
    if [ ! -f .env.local ]; then
        error ".env.local file not found. Please run the setup first."
        return 1
    fi
    
    # Read .env.local and set variables in Vercel
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ "$line" =~ ^#.*$ ]] || [[ -z "$line" ]]; then
            continue
        fi
        
        # Extract key and value
        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # Skip if value is placeholder
            if [[ "$value" =~ ^your_.*|^https://your-.*|^sk-your_.*|^re_your_.*|^phc_your_.* ]]; then
                continue
            fi
            
            log "Setting $key in Vercel..."
            vercel env add "$key" production <<< "$value"
        fi
    done < .env.local
    
    success "Vercel environment variables configured"
}

# Display manual setup instructions
show_manual_setup() {
    echo ""
    echo "🔧 Manual Setup Required"
    echo "========================"
    echo ""
    echo "The following services need to be set up manually:"
    echo ""
    
    echo "1. 🤖 OpenAI API Key"
    echo "   - Go to: https://platform.openai.com/api-keys"
    echo "   - Create a new API key"
    echo "   - Update OPENAI_API_KEY in .env.local"
    echo ""
    
    echo "2. 👁️ Google Vision API"
    echo "   - Go to: https://console.cloud.google.com/"
    echo "   - Enable Vision API"
    echo "   - Create credentials (API key)"
    echo "   - Update GOOGLE_VISION_API_KEY in .env.local"
    echo ""
    
    echo "3. 📧 Resend Email API"
    echo "   - Go to: https://resend.com/"
    echo "   - Create account and get API key"
    echo "   - Update RESEND_API_KEY in .env.local"
    echo ""
    
    echo "4. 📊 Optional Services:"
    echo "   - Sentry (error tracking): https://sentry.io/"
    echo "   - PostHog (analytics): https://posthog.com/"
    echo "   - Pinecone (vector database): https://pinecone.io/"
    echo "   - Upstash Redis (caching): https://upstash.com/"
    echo ""
    
    echo "5. 🔔 Slack Webhook (optional)"
    echo "   - Create Slack app: https://api.slack.com/apps"
    echo "   - Add incoming webhook"
    echo "   - Update SLACK_WEBHOOK_URL in .env.local"
    echo ""
    
    warning "After setting up these services, update the corresponding values in .env.local"
}

# Cleanup temporary files
cleanup() {
    rm -f /tmp/supabase_config /tmp/vercel_config /tmp/app_secrets /tmp/vapid_config
}

# Main setup function
main() {
    echo "🚀 Pourtrait Service Setup"
    echo "=========================="
    echo ""
    echo "This script will help you set up all the required services for Pourtrait."
    echo "Some services can be configured automatically, others require manual setup."
    echo ""
    
    read -p "Do you want to continue? [y/N]: " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    # Run setup steps
    check_dependencies
    
    echo ""
    read -p "Set up Supabase project? [y/N]: " setup_sb
    if [ "$setup_sb" = "y" ] || [ "$setup_sb" = "Y" ]; then
        setup_supabase
    fi
    
    echo ""
    read -p "Set up Vercel project? [y/N]: " setup_vc
    if [ "$setup_vc" = "y" ] || [ "$setup_vc" = "Y" ]; then
        setup_vercel
    fi
    
    generate_secrets
    setup_vapid_keys
    create_env_file
    
    echo ""
    read -p "Set up Vercel environment variables? [y/N]: " setup_env
    if [ "$setup_env" = "y" ] || [ "$setup_env" = "Y" ]; then
        setup_vercel_env
    fi
    
    show_manual_setup
    
    echo ""
    success "Automated setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Complete the manual setup for external APIs"
    echo "2. Update .env.local with the API keys"
    echo "3. Run: npm run build (to test the configuration)"
    echo "4. Run: git push origin main (to deploy)"
    echo ""
}

# Help function
show_help() {
    echo "Pourtrait Service Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --supabase     Set up Supabase only"
    echo "  --vercel       Set up Vercel only"
    echo "  --env          Create .env.local only"
    echo ""
    echo "This script automates the setup of:"
    echo "  ✅ Supabase project and database"
    echo "  ✅ Vercel project and deployment"
    echo "  ✅ Application secrets generation"
    echo "  ✅ VAPID keys for push notifications"
    echo "  ✅ Environment variable configuration"
    echo ""
    echo "Manual setup required for:"
    echo "  🔧 OpenAI API key"
    echo "  🔧 Google Vision API key"
    echo "  🔧 Resend email API key"
    echo "  🔧 Optional monitoring services"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --supabase)
        check_dependencies
        setup_supabase
        exit 0
        ;;
    --vercel)
        check_dependencies
        setup_vercel
        exit 0
        ;;
    --env)
        generate_secrets
        setup_vapid_keys
        create_env_file
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac