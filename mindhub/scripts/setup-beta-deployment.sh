#!/bin/bash

# MindHub Beta - Complete Setup Script
# This script prepares the entire project for beta deployment

set -e  # Exit on any error

echo "🚀 MindHub Beta - Complete Setup Script"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "DEPLOYMENT_PLAN_BETA.md" ]; then
    error "Please run this script from the mindhub root directory"
    exit 1
fi

success "Running from correct directory"

# Step 1: Install dependencies
echo
info "Step 1: Installing dependencies..."
echo

if [ -d "frontend" ]; then
    cd frontend
    info "Installing frontend dependencies..."
    npm install
    success "Frontend dependencies installed"
    cd ..
else
    error "Frontend directory not found"
    exit 1
fi

if [ -d "backend" ]; then
    cd backend
    info "Installing backend dependencies..."
    npm install
    success "Backend dependencies installed"
    cd ..
else
    error "Backend directory not found"
    exit 1
fi

# Step 2: Environment setup
echo
info "Step 2: Setting up environment files..."
echo

if [ ! -f "frontend/.env.local" ]; then
    cp .env.development.example frontend/.env.local
    success "Frontend environment file created"
else
    warning "Frontend .env.local already exists"
fi

if [ ! -f "backend/.env" ]; then
    cp .env.development.example backend/.env
    success "Backend environment file created"
else
    warning "Backend .env already exists"
fi

# Step 3: Database setup
echo
info "Step 3: Setting up database..."
echo

# Check if MAMP is running (optional)
if command -v mysql >/dev/null 2>&1; then
    info "MySQL client found"
    
    # Try to apply migration
    cd backend
    if node scripts/apply-simple-auth-migration.js; then
        success "Database migration applied successfully"
    else
        warning "Migration may have failed - check output above"
        warning "This is normal if tables already exist"
    fi
    cd ..
else
    warning "MySQL client not found - please run migration manually:"
    warning "cd backend && node scripts/apply-simple-auth-migration.js"
fi

# Step 4: Pre-deployment check
echo
info "Step 4: Running pre-deployment check..."
echo

if node scripts/pre-deployment-check.js; then
    success "All pre-deployment checks passed!"
else
    error "Pre-deployment checks failed - please fix issues above"
    exit 1
fi

# Step 5: Test local startup
echo
info "Step 5: Testing local startup..."
echo

# Test backend startup
cd backend
info "Testing backend startup..."
timeout 10s npm start > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 3

if kill -0 $BACKEND_PID 2>/dev/null; then
    success "Backend starts successfully"
    kill $BACKEND_PID
else
    warning "Backend may have startup issues - check manually"
fi
cd ..

# Test frontend build
cd frontend
info "Testing frontend build..."
if npm run build > /dev/null 2>&1; then
    success "Frontend builds successfully"
else
    error "Frontend build failed"
    exit 1
fi
cd ..

# Final summary
echo
echo "🎉 Setup Complete!"
echo "=================="
echo
success "MindHub Beta is ready for deployment!"
echo
info "Next steps:"
echo "1. 🧪 Test locally:"
echo "   - Backend: cd backend && npm start"
echo "   - Frontend: cd frontend && npm run dev"
echo
echo "2. 🚀 Deploy to production:"
echo "   - Vercel: Connect GitHub repo, set environment variables"
echo "   - Railway: Add MySQL + Node.js service, set environment variables"
echo
echo "3. 🔧 Production setup:"
echo "   - Copy .env.production.example and fill with real values"
echo "   - Run migration on production database"
echo "   - Configure domains: app.mindhub.cloud, api.mindhub.cloud"
echo
info "For detailed instructions, see DEPLOYMENT_README.md"
echo
success "Good luck with your beta launch! 🚀"