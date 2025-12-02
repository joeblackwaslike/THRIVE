#!/bin/bash

# THRIVE Sentry Integration Testing Script
# This script runs a comprehensive test sequence for Sentry integration

echo "🚀 Starting Sentry Integration Test Sequence..."
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Step 1: Install dependencies
print_status "Step 1: Installing dependencies..."
if pnpm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Type checking
print_status "Step 2: Running TypeScript type checking..."
if pnpm run type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    print_warning "Check the TypeScript errors above and fix them before proceeding"
    exit 1
fi

# Step 3: Linting (with auto-fix)
print_status "Step 3: Running linting and formatting..."
if pnpm run check; then
    print_success "Linting and formatting completed"
else
    print_warning "Some linting issues found. Check the warnings above."
    print_warning "You can run 'pnpm run check -- --fix' to auto-fix some issues"
fi

# Step 4: Build test
print_status "Step 4: Testing build process..."
if pnpm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    print_warning "Check the build errors above and fix them before proceeding"
    exit 1
fi

# Step 5: Check environment variables
print_status "Step 5: Checking environment configuration..."
if [ -f ".env" ]; then
    if grep -q "VITE_SENTRY_DSN" .env; then
        print_success "Sentry DSN found in environment"
    else
        print_warning "VITE_SENTRY_DSN not found in .env file"
        print_warning "Add your Sentry DSN to test error tracking"
    fi
else
    print_warning ".env file not found"
    print_warning "Create a .env file with your Sentry configuration"
fi

# Step 6: Start development servers
print_status "Step 6: Starting development servers..."
echo ""
echo "🔄 Starting both client and server in development mode..."
echo "   - Client: http://localhost:5173"
echo "   - Server: http://localhost:3001"
echo "   - Sentry Monitor: http://localhost:5173/monitoring"
echo ""
echo "🧪 Testing Sentry Integration:"
echo "   1. Visit the monitoring dashboard at: http://localhost:5173/monitoring"
echo "   2. Click 'Test Message' and 'Test Error' buttons"
echo "   3. Check your Sentry dashboard for incoming events"
echo "   4. Test the backend error endpoint: http://localhost:3001/debug-sentry"
echo ""

# Start the development servers
pnpm run dev

echo ""
print_success "Development servers started successfully!"
print_status "Monitor the console output for any Sentry-related messages"
print_status "Check your Sentry dashboard for test events"