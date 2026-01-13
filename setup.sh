#!/bin/bash

echo "🎯 Billboard Market - Quick Setup (No Docker Required)"
echo "======================================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18+. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm -v)"

echo ""
echo "📋 DATABASE SETUP OPTIONS:"
echo ""
echo "  Option 1: FREE Cloud Services (Recommended for slow machines)"
echo "  ─────────────────────────────────────────────────────────────"
echo "  • PostgreSQL: https://neon.tech (free tier)"
echo "  • Redis: https://upstash.com (free tier)"
echo ""
echo "  Option 2: Local Installation"
echo "  ────────────────────────────"
echo "  • macOS: brew install postgresql@16 redis"
echo "  • Linux: sudo apt install postgresql redis-server"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ Created .env - Please edit it with your database URLs"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env before continuing!"
    echo "   Add your PostgreSQL and Redis connection strings."
    echo ""
    read -p "Press Enter after you've configured .env..."
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🗄️ Setting up database..."
pnpm db:generate
pnpm db:push
pnpm db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo "   Terminal 1: pnpm --filter web dev"
echo "   Terminal 2: pnpm --filter worker dev"
echo ""
echo "   Then visit: http://localhost:3000"
echo ""
