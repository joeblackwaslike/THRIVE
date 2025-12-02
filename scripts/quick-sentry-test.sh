#!/bin/bash

# Quick Sentry Integration Test
# This script performs a quick verification of Sentry integration

echo "🔍 Quick Sentry Integration Test"
echo "==============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test functions
test_frontend_sentry() {
    echo "Testing Frontend Sentry..."
    
    # Check if VITE_SENTRY_DSN is set
    if grep -q "VITE_SENTRY_DSN" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} VITE_SENTRY_DSN found in .env"
    else
        echo -e "${RED}✗${NC} VITE_SENTRY_DSN not found in .env"
        return 1
    fi
    
    # Check if Sentry is imported in main.tsx
    if grep -q "import \* as Sentry from '@sentry/react'" src/main.tsx 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Sentry imported in main.tsx"
    else
        echo -e "${RED}✗${NC} Sentry not imported in main.tsx"
        return 1
    fi
    
    # Check if Sentry is initialized
    if grep -q "Sentry.init" src/main.tsx 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Sentry initialization found"
    else
        echo -e "${RED}✗${NC} Sentry initialization not found"
        return 1
    fi
    
    return 0
}

test_backend_sentry() {
    echo "Testing Backend Sentry..."
    
    # Check if SENTRY_DSN is set
    if grep -q "SENTRY_DSN" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} SENTRY_DSN found in .env"
    else
        echo -e "${RED}✗${NC} SENTRY_DSN not found in .env"
        return 1
    fi
    
    # Check if Sentry is imported in backend
    if grep -q "import \* as Sentry from '@sentry/node'" api/instrument.ts 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Sentry imported in backend"
    else
        echo -e "${RED}✗${NC} Sentry not imported in backend"
        return 1
    fi
    
    # Check if debug endpoint exists
    if grep -q "debug-sentry" api/app.ts 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Debug endpoint found"
    else
        echo -e "${RED}✗${NC} Debug endpoint not found"
        return 1
    fi
    
    return 0
}

test_monitoring_component() {
    echo "Testing Monitoring Component..."
    
    # Check if monitoring route exists
    if [ -f "src/routes/monitoring.tsx" ]; then
        echo -e "${GREEN}✓${NC} Monitoring route exists"
    else
        echo -e "${RED}✗${NC} Monitoring route not found"
        return 1
    fi
    
    # Check if SentryMonitor component exists
    if [ -f "src/components/monitoring/SentryMonitor.tsx" ]; then
        echo -e "${GREEN}✓${NC} SentryMonitor component exists"
    else
        echo -e "${RED}✗${NC} SentryMonitor component not found"
        return 1
    fi
    
    return 0
}

test_dependencies() {
    echo "Testing Dependencies..."
    
    # Check if Sentry packages are installed
    if grep -q "@sentry/react" package.json 2>/dev/null; then
        echo -e "${GREEN}✓${NC} @sentry/react installed"
    else
        echo -e "${RED}✗${NC} @sentry/react not installed"
        return 1
    fi
    
    if grep -q "@sentry/node" package.json 2>/dev/null; then
        echo -e "${GREEN}✓${NC} @sentry/node installed"
    else
        echo -e "${RED}✗${NC} @sentry/node not installed"
        return 1
    fi
    
    if grep -q "@sentry/vite-plugin" package.json 2>/dev/null; then
        echo -e "${GREEN}✓${NC} @sentry/vite-plugin installed"
    else
        echo -e "${RED}✗${NC} @sentry/vite-plugin not installed"
        return 1
    fi
    
    return 0
}

# Run tests
echo "1. Testing Dependencies..."
if test_dependencies; then
    echo -e "${GREEN}✓ Dependencies test passed${NC}"
else
    echo -e "${RED}✗ Dependencies test failed${NC}"
fi

echo ""
echo "2. Testing Frontend Sentry..."
if test_frontend_sentry; then
    echo -e "${GREEN}✓ Frontend Sentry test passed${NC}"
else
    echo -e "${RED}✗ Frontend Sentry test failed${NC}"
fi

echo ""
echo "3. Testing Backend Sentry..."
if test_backend_sentry; then
    echo -e "${GREEN}✓ Backend Sentry test passed${NC}"
else
    echo -e "${RED}✗ Backend Sentry test failed${NC}"
fi

echo ""
echo "4. Testing Monitoring Component..."
if test_monitoring_component; then
    echo -e "${GREEN}✓ Monitoring component test passed${NC}"
else
    echo -e "${RED}✗ Monitoring component test failed${NC}"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Run: pnpm run type-check"
echo "2. Run: pnpm run check"
echo "3. Run: pnpm run build"
echo "4. Run: pnpm run dev"
echo "5. Visit: http://localhost:5173/monitoring"
echo "6. Test: http://localhost:3001/debug-sentry"
echo ""
echo "📊 Check your Sentry dashboard for test events!"