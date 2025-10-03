#!/bin/bash

# Comprehensive codebase health check script
# Run this before starting any task and before marking tasks complete

set -e  # Exit on any error

echo "🔍 Starting comprehensive health check..."
echo "================================================"

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Check if we need to upgrade Node for any tools
if [[ "$NODE_VERSION" < "v20" ]]; then
    echo "⚠️  Warning: Node.js version is $NODE_VERSION. Some tools may require Node 20+"
    echo "💡 Consider upgrading: brew install node"
fi

# Type checking
echo ""
echo "📋 Running TypeScript type check..."
npm run type-check

# Linting
echo ""
echo "✨ Running linter..."
npm run lint

# Full test suite
echo ""
echo "🧪 Running full test suite..."
npm test -- --run

# Build validation
echo ""
echo "🏗️ Validating build..."
npm run build

# Check for outdated dependencies
echo ""
echo "📦 Checking for outdated dependencies..."
npm outdated || echo "Some dependencies may be outdated"

# Check for security vulnerabilities
echo ""
echo "🔒 Checking for security vulnerabilities..."
npm audit --audit-level=moderate || echo "Security vulnerabilities found - consider running 'npm audit fix'"

echo ""
echo "✅ Health check complete!"
echo "================================================"