#!/bin/bash

# Sync Environment Variables to Vercel
# Automatically uploads .env.local variables to Vercel production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check if Vercel CLI is installed and user is logged in
check_vercel() {
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI not found. Install with: npm install -g vercel"
        exit 1
    fi
    
    if ! vercel whoami &> /dev/null; then
        log "Logging into Vercel..."
        vercel login
    fi
    
    success "Vercel CLI ready"
}

# Sync environment variables to Vercel
sync_env_vars() {
    log "Syncing environment variables to Vercel production..."
    
    if [ ! -f .env.local ]; then
        error ".env.local file not found"
        exit 1
    fi
    
    local count=0
    local skipped=0
    
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
                warning "Skipping placeholder: $key"
                ((skipped++))
                continue
            fi
            
            # Skip empty values
            if [ -z "$value" ]; then
                warning "Skipping empty value: $key"
                ((skipped++))
                continue
            fi
            
            log "Setting $key in Vercel production..."
            
            # Use vercel env add with production target
            if echo "$value" | vercel env add "$key" production --force > /dev/null 2>&1; then
                success "✓ $key"
                ((count++))
            else
                error "✗ Failed to set $key"
            fi
        fi
    done < .env.local
    
    echo ""
    success "Environment sync completed!"
    log "Variables set: $count"
    log "Variables skipped: $skipped"
    echo ""
    
    # Show next steps
    echo "🚀 Next Steps:"
    echo "1. Verify variables in Vercel dashboard"
    echo "2. Deploy: git push origin main"
    echo "3. Monitor: npm run verify:production"
}

# Show current Vercel project info
show_project_info() {
    log "Current Vercel project information:"
    
    # Check if .vercel directory exists (indicates linked project)
    if [ -d ".vercel" ]; then
        local project_json=".vercel/project.json"
        if [ -f "$project_json" ]; then
            local project_name=$(jq -r '.name // "unknown"' "$project_json")
            local project_id=$(jq -r '.projectId // "unknown"' "$project_json")
            
            echo "  Project: $project_name"
            echo "  Project ID: $project_id"
            echo ""
            success "Vercel project is linked"
        else
            warning "Project linked but configuration not found"
        fi
    else
        warning "No Vercel project linked. Run 'vercel link' first."
        exit 1
    fi
}

# Main function
main() {
    echo "🔄 Sync Environment Variables to Vercel"
    echo "======================================"
    echo ""
    
    check_vercel
    show_project_info
    
    echo "This will sync your .env.local variables to Vercel production environment."
    echo ""
    read -p "Continue? [y/N]: " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Sync cancelled."
        exit 0
    fi
    
    sync_env_vars
}

# Help function
show_help() {
    echo "Sync Environment Variables to Vercel"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --dry-run      Show what would be synced without actually doing it"
    echo ""
    echo "This script:"
    echo "  📤 Reads .env.local file"
    echo "  🔄 Syncs variables to Vercel production environment"
    echo "  ⚡ Uses Vercel CLI for fast, reliable sync"
    echo "  🛡️ Skips placeholder and empty values"
    echo ""
    echo "Prerequisites:"
    echo "  - Vercel CLI installed (npm install -g vercel)"
    echo "  - Logged into Vercel (vercel login)"
    echo "  - Project linked to Vercel (vercel link)"
}

# Dry run function
dry_run() {
    log "Dry run - showing what would be synced:"
    echo ""
    
    if [ ! -f .env.local ]; then
        error ".env.local file not found"
        exit 1
    fi
    
    local count=0
    local skipped=0
    
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
                echo "  ⏭️  SKIP: $key (placeholder value)"
                ((skipped++))
                continue
            fi
            
            # Skip empty values
            if [ -z "$value" ]; then
                echo "  ⏭️  SKIP: $key (empty value)"
                ((skipped++))
                continue
            fi
            
            echo "  ✅ SYNC: $key"
            ((count++))
        fi
    done < .env.local
    
    echo ""
    log "Would sync: $count variables"
    log "Would skip: $skipped variables"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --dry-run)
        dry_run
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