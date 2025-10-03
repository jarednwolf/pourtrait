#!/bin/bash

# Dependency Decision Advisor
# Helps make optimal decisions about using existing packages vs custom implementation

SEARCH_TERM="$1"

if [ -z "$SEARCH_TERM" ]; then
    echo "Usage: ./scripts/dependency-advisor.sh <search-term>"
    echo "Example: ./scripts/dependency-advisor.sh storybook"
    exit 1
fi

echo "🔍 Dependency Analysis for: $SEARCH_TERM"
echo "================================================"

# Check current Node version
NODE_VERSION=$(node --version)
echo "📋 Current Node.js version: $NODE_VERSION"

# Search npm for relevant packages
echo ""
echo "📦 Searching npm registry..."
npm search "$SEARCH_TERM" --json | head -20 || echo "Search failed or no results"

# Check if we have outdated dependencies
echo ""
echo "📊 Current dependency status..."
npm outdated | grep -i "$SEARCH_TERM" || echo "No outdated dependencies found for $SEARCH_TERM"

# Check for security issues
echo ""
echo "🔒 Security audit..."
npm audit --json | grep -i "$SEARCH_TERM" || echo "No security issues found for $SEARCH_TERM"

# Provide recommendations
echo ""
echo "💡 Recommendations:"
echo "1. Check official framework integrations first"
echo "2. Prefer packages with:"
echo "   - Recent updates (< 6 months)"
echo "   - High download counts"
echo "   - Good TypeScript support"
echo "   - Active maintenance"
echo "3. Consider upgrading existing dependencies before adding new ones"
echo "4. Test compatibility in a branch first"

echo ""
echo "🎯 Next Steps:"
echo "1. Review search results above"
echo "2. Check official documentation for integrations"
echo "3. Test in development environment"
echo "4. Document decision rationale"

echo ""
echo "================================================"