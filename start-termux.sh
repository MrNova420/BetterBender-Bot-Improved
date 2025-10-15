#!/data/data/com.termux/files/usr/bin/bash

echo "🤖 Starting Minecraft Bot for Termux..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    pkg install nodejs -y
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if bot is configured
if grep -q '"ip": "localhost"' config/settings.json; then
    echo ""
    echo "⚠️  BOT NOT CONFIGURED YET!"
    echo ""
    echo "📝 Quick setup (recommended):"
    echo "   node quick-config.js <username> <server-ip> <version>"
    echo ""
    echo "Example:"
    echo "   node quick-config.js MyBot play.example.com 1.20.1"
    echo ""
    echo "Or run: npm run setup (for interactive setup)"
    echo ""
    read -p "Press Enter to continue anyway (dashboard only mode)..."
fi

echo "🚀 Starting bot with PM2..."
pm2 start ecosystem.config.js --only bot-enhanced

echo "✅ Bot started successfully!"
echo ""
echo "📊 Dashboard: http://localhost:5000"
echo ""
echo "Commands:"
echo "  pm2 logs          - View logs"
echo "  pm2 monit         - Monitor bot"
echo "  pm2 restart all   - Restart bot"
echo "  pm2 stop all      - Stop bot"
echo ""
echo "Auto-start on device boot:"
echo "  pm2 startup"
echo "  pm2 save"
