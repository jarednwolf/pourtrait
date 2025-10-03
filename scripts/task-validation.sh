#!/bin/bash

# Task-specific validation script
# Usage: ./scripts/task-validation.sh "task-name" "test-paths"

set -e

TASK_NAME="$1"
TEST_PATHS="$2"

echo "🎯 Validating Task: $TASK_NAME"
echo "================================================"

# Run task-specific tests first
if [ -n "$TEST_PATHS" ]; then
    echo "🧪 Running task-specific tests..."
    npm test -- --run $TEST_PATHS
    echo "✅ Task-specific tests passed"
else
    echo "⚠️  No specific test paths provided, running full suite..."
fi

# Run full health check
echo ""
echo "🔍 Running full codebase health check..."
./scripts/health-check.sh

echo ""
echo "✅ Task validation complete for: $TASK_NAME"
echo "================================================"