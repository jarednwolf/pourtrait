#!/bin/bash

# Connect to Existing Services Script
# Links to existing Vercel, GitHub, and Supabase projects and populates .env.local

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
    
    if ! command -v supabase &> /dev/null; then
        missing_tools+=("supabase")
    fi
    
    if ! command -v vercel &> /dev/null; then
        missing_tools+=("vercel")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Install missing tools:"
        echo "- Supabase CLI: npm install -g supabase"
        echo "- Vercel CLI: npm install -g vercel"
        exit 1
    fi
    
    success "All required CLI tools are installed"
}

# Connect to existing Supabase project
connect_supabase() {
    log "Connecting to existing Supabase project..."
    
    echo ""
    echo "🗄️ Supabase Connection"
    echo "======================"
    
    # Login to Supabase if not already logged in
    if ! supabase projects list &> /dev/null; then
        log "Logging into Supabase..."
        supabase login
    fi
    
    # List available projects
    echo ""
    log "Available Supabase projects:"
    supabase projects list
    
    echo ""
    read -p "Enter your Supabase project reference ID: " project_ref
    
    # Link to the project
    log "Linking to Supabase project: $project_ref"
    supabase link --project-ref "$project_ref"
    
    # Get project details
    log "Getting project configuration..."
    supabase status
    
    # Extract configuration values
    local project_url=$(supabase status | grep "API URL" | awk '{print $3}')
    local anon_key=$(supabase status | grep "anon key" | awk '{print $3}')
    local service_key=$(supabase status | grep "service_role key" | awk '{print $3}')
    
    # Store configuration
    cat > /tmp/supabase_config << EOF
NEXT_PUBLIC_SUPABASE_URL=$project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon_key
SUPABASE_SERVICE_ROLE_KEY=$service_key
SUPABASE_PROJECT_REF=$project_ref
EOF
    
    success "Connected to Supabase project successfully"
    
    # Ask about running migrations
    echo ""
    read -p "Do you want to run database migrations now? [y/N]: " run_migrations
    if [ "$run_migrations" = "y" ] || [ "$run_migrations" = "Y" ]; then
        log "Running database migrations..."
        supabase db push
        success "Database migrations completed"
    else
        warning "Skipping migrations. Run 'supabase db push' later if needed."
    fi
}

# Connect to existing Vercel project
connect_vercel() {
    log "Connecting to existing Vercel project..."
    
    echo ""
    echo "🚀 Vercel Connection"
    echo "==================="
    
    # Login to Vercel if not already logged in
    if ! vercel whoami &> /dev/null; then
        log "Logging into Vercel..."
        vercel login
    fi
    
    # List available projects
    echo ""
    log "Available Vercel projects:"
    vercel project ls
    
    echo ""
    read -p "Enter your Vercel project name: " project_name
    
    # Link to the project
    log "Linking to Vercel project: $project_name"
    vercel link --yes --project="$project_name"
    
    # Get project details
    local project_info=$(vercel project ls --format json | jq -r ".[] | select(.name == \"$project_name\")")
    local project_id=$(echo "$project_info" | jq -r '.id')
    local org_id=$(echo "$project_info" | jq -r '.accountId')
    
    # Get production URL
    local prod_url=$(echo "$project_info" | jq -r '.targets.production.url // empty')
    if [ -z "$prod_url" ]; then
        read -p "Enter your production domain (e.g., your-app.vercel.app): " prod_url
    fi
    
    # Ensure https://
    if [[ ! "$prod_url" =~ ^https?:// ]]; then
        prod_url="https://$prod_url"
    fi
    
    # Store configuration
    cat > /tmp/vercel_config << EOF
VERCEL_PROJECT_ID=$project_id
VERCEL_ORG_ID=$org_id
NEXT_PUBLIC_APP_URL=$prod_url
NEXTAUTH_URL=$prod_url
EOF
    
    success "Connected to Vercel project successfully"
}

# Generate application secrets
generate_secrets() {
    log "Generating application secrets..."
    
    # Generate random secrets using openssl
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
    log "Setting up push notification keys..."
    
    # Check if web-push is available
    if ! command -v web-push &> /dev/null; then
        log "Installing web-push CLI..."
        npm install -g web-push
    fi
    
    # Generate VAPID keys
    local vapid_keys=$(web-push generate-vapid-keys --json)
    local public_key=$(echo "$vapid_keys" | jq -r '.publicKey')
    local private_key=$(echo "$vapid_keys" | jq -r '.privateKey')
    
    read -p "Enter your email for VAPID subject (e.g., admin@yourdomain.com): " vapid_email
    
    cat > /tmp/vapid_config << EOF
VAPID_PUBLIC_KEY=$public_key
VAPID_PRIVATE_KEY=$private_key
VAPID_SUBJECT=mailto:$vapid_email
EOF
    
    success "VAPID keys generated successfully"
}

# Create or update .env.local file
update_env_file() {
    log "Creating/updating .env.local file..."
    
    # Start with existing .env.local or create from template
    if [ ! -f .env.local ]; then
        if [ -f .env.local.example ]; then
            cp .env.local.example .env.local
            log "Created .env.local from template"
        else
            error ".env.local.example not found"
            exit 1
        fi
    else
        log "Updating existing .env.local file"
    fi
    
    # Update basic configuration
    sed -i.bak "s|NODE_ENV=.*|NODE_ENV=production|" .env.local
    sed -i.bak "s|NEXT_PUBLIC_APP_NAME=.*|NEXT_PUBLIC_APP_NAME=Pourtrait|" .env.local
    sed -i.bak "s|NEXT_PUBLIC_VERCEL_ENV=.*|NEXT_PUBLIC_VERCEL_ENV=production|" .env.local
    
    # Merge configurations from temporary files
    local config_files=("/tmp/supabase_config" "/tmp/vercel_config" "/tmp/app_secrets" "/tmp/vapid_config")
    
    for config_file in "${config_files[@]}"; do
        if [ -f "$config_file" ]; then
            while IFS= read -r line; do
                if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                    key="${BASH_REMATCH[1]}"
                    value="${BASH_REMATCH[2]}"
                    
                    # Update the line in .env.local
                    if grep -q "^$key=" .env.local; then
                        sed -i.bak "s|^$key=.*|$line|" .env.local
                    else
                        echo "$line" >> .env.local
                    fi
                fi
            done < "$config_file"
        fi
    done
    
    # Set feature flags for OpenAI-only setup
    sed -i.bak "s|FEATURE_AI_RECOMMENDATIONS=.*|FEATURE_AI_RECOMMENDATIONS=true|" .env.local
    sed -i.bak "s|FEATURE_IMAGE_PROCESSING=.*|FEATURE_IMAGE_PROCESSING=true|" .env.local
    sed -i.bak "s|FEATURE_PUSH_NOTIFICATIONS=.*|FEATURE_PUSH_NOTIFICATIONS=true|" .env.local
    sed -i.bak "s|FEATURE_ANALYTICS=.*|FEATURE_ANALYTICS=true|" .env.local
    sed -i.bak "s|FEATURE_MAINTENANCE_MODE=.*|FEATURE_MAINTENANCE_MODE=false|" .env.local
    
    # Remove backup file
    rm -f .env.local.bak
    
    success ".env.local file updated successfully"
}

# Update image processing service to use OpenAI Vision
update_image_processing() {
    log "Configuring image processing to use OpenAI Vision..."
    
    # Comment out Google Vision API key in .env.local
    sed -i.bak "s|^GOOGLE_VISION_API_KEY=|# GOOGLE_VISION_API_KEY=|" .env.local
    sed -i.bak "s|^GOOGLE_APPLICATION_CREDENTIALS_JSON=|# GOOGLE_APPLICATION_CREDENTIALS_JSON=|" .env.local
    
    # Add comment explaining the setup
    if ! grep -q "# Using OpenAI Vision instead of Google Vision" .env.local; then
        echo "" >> .env.local
        echo "# Using OpenAI Vision instead of Google Vision for image processing" >> .env.local
        echo "# GOOGLE_VISION_API_KEY=your_google_vision_api_key_here" >> .env.local
        echo "# GOOGLE_APPLICATION_CREDENTIALS_JSON={\"type\":\"service_account\",...}" >> .env.local
    fi
    
    rm -f .env.local.bak
    success "Image processing configured for OpenAI Vision"
}

# Set Vercel environment variables
setup_vercel_env() {
    echo ""
    read -p "Do you want to sync environment variables to Vercel? [y/N]: " sync_env
    
    if [ "$sync_env" != "y" ] && [ "$sync_env" != "Y" ]; then
        warning "Skipping Vercel environment variable sync"
        return 0
    fi
    
    log "Syncing environment variables to Vercel..."
    
    if [ ! -f .env.local ]; then
        error ".env.local file not found"
        return 1
    fi
    
    # Read .env.local and set variables in Vercel
    local count=0
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
            
            # Skip empty values
            if [ -z "$value" ]; then
                continue
            fi
            
            log "Setting $key in Vercel..."
            echo "$value" | vercel env add "$key" production
            ((count++))
        fi
    done < .env.local
    
    success "Synced $count environment variables to Vercel"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "✅ Connected to existing Supabase project"
    echo "✅ Connected to existing Vercel project"
    echo "✅ Generated application secrets"
    echo "✅ Configured for OpenAI Vision (no Google Vision needed)"
    echo "✅ Updated .env.local file"
    echo ""
    
    # Check if OpenAI key is configured
    if grep -q "OPENAI_API_KEY=sk-" .env.local; then
        echo "✅ OpenAI API key is configured"
    else
        echo "⚠️  OpenAI API key needs to be added to .env.local"
    fi
    
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Verify your .env.local file has all required values"
    echo "2. Test the build: npm run build"
    echo "3. Deploy: git push origin main"
    echo "4. Verify deployment: npm run verify:production"
    echo ""
    
    echo "📋 Optional Services (can add later):"
    echo "- Resend (email): https://resend.com/"
    echo "- Sentry (error tracking): https://sentry.io/"
    echo "- PostHog (analytics): https://posthog.com/"
    echo ""
    
    echo "📄 Configuration file: .env.local"
    echo "🔗 Supabase dashboard: https://supabase.com/dashboard/project/$(cat /tmp/supabase_config | grep PROJECT_REF | cut -d'=' -f2)"
    echo "🔗 Vercel dashboard: https://vercel.com/dashboard"
}

# Cleanup temporary files
cleanup() {
    rm -f /tmp/supabase_config /tmp/vercel_config /tmp/app_secrets /tmp/vapid_config
}

# Main function
main() {
    echo "🔗 Connect to Existing Services"
    echo "==============================="
    echo ""
    echo "This script will connect to your existing:"
    echo "- Supabase project (database)"
    echo "- Vercel project (hosting)"
    echo "- GitHub repository (already connected)"
    echo ""
    echo "And configure everything to use OpenAI Vision for image processing."
    echo ""
    
    read -p "Continue? [y/N]: " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    # Run setup steps
    check_dependencies
    connect_supabase
    connect_vercel
    generate_secrets
    setup_vapid_keys
    update_env_file
    update_image_processing
    setup_vercel_env
    show_next_steps
    
    success "All services connected successfully!"
}

# Help function
show_help() {
    echo "Connect to Existing Services Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --supabase     Connect to Supabase only"
    echo "  --vercel       Connect to Vercel only"
    echo ""
    echo "This script connects to existing services:"
    echo "  🗄️ Supabase project and database"
    echo "  🚀 Vercel project and deployment"
    echo "  🔑 Generates application secrets"
    echo "  📱 Sets up push notification keys"
    echo "  🖼️ Configures OpenAI Vision for image processing"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --supabase)
        check_dependencies
        connect_supabase
        exit 0
        ;;
    --vercel)
        check_dependencies
        connect_vercel
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