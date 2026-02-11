#!/bin/bash

# Quick Start Script for Frontend Backend Setup
# Usage: bash quick-start.sh

set -e

echo "🚀 Frontend Backend Quick Start"
echo "==============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Navigate to frontend directory if not already there
if [ ! -f "package.json" ]; then
    echo "📁 Changing to frontend directory..."
    cd frontend || exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""

# Display next steps
echo "📋 Next Steps:"
echo "============="
echo ""
echo "1. 📝 Configure .env file:"
echo "   nano .env  (or edit in your editor)"
echo ""
echo "2. 🗄️  Ensure database is running:"
echo "   docker-compose up -d db"
echo ""
echo "3. 🚀 Start development server:"
echo "   npm run dev"
echo ""
echo "4. 🧪 Run tests in another terminal:"
echo "   npm run test:all"
echo ""
echo "5. 📚 Read documentation:"
echo "   - API.md - API endpoint reference"
echo "   - tests/README.md - Testing guide"
echo "   - BACKEND_SETUP.md - Complete setup information"
echo ""
echo "🎉 Happy coding!"
