#!/bin/bash

# BetterBender 2.0 - Easy Start Script
# This script starts the bot with proper configuration

echo "🤖 BetterBender 2.0 - Starting..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js first:"
    echo "  - Visit: https://nodejs.org/"
    echo "  - Or use: pkg install nodejs-lts (Termux)"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies!"
        exit 1
    fi
fi

# Check if CONFIG.json exists
if [ ! -f "CONFIG.json" ]; then
    echo "⚠️  CONFIG.json not found!"
    echo "Creating from example..."
    cp CONFIG.example.json CONFIG.json
    echo "✅ CONFIG.json created!"
    echo ""
    echo "📝 Please edit CONFIG.json and set your server address:"
    echo "   - Change 'localhost' to your Minecraft server"
    echo "   - Set your account type (offline/microsoft/mojang)"
    echo ""
    exit 0
fi

# Display configuration
echo "📋 Current Configuration:"
echo "   Server: $(grep -oP '(?<="host": ")[^"]*' CONFIG.json)"
echo "   Port: $(grep -oP '(?<="port": )\d+' CONFIG.json)"
echo "   Mode: $(grep -oP '(?<="current": ")[^"]*' CONFIG.json)"
echo ""

# Check if server is localhost (warn user)
if grep -q '"host": "localhost"' CONFIG.json; then
    echo "⚠️  WARNING: Server is set to 'localhost'!"
    echo "   This will only work if you have a Minecraft server running locally."
    echo "   To connect to a real server, edit CONFIG.json and change the host."
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo "🚀 Starting BetterBender..."
echo "📊 Dashboard will be available at: http://localhost:5000"
echo "🔑 For localhost connections, no login required!"
echo ""
echo "Press Ctrl+C to stop the bot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the bot
node dashboard/server.js CONFIG.json
