#!/data/data/com.termux/files/usr/bin/bash

echo "🤖 BetterBender 2.0 - Termux Installation Script"
echo "================================================"
echo ""

cd "$(dirname "$0")/.."

if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found. Installing..."
    pkg update -y
    pkg install nodejs -y
    
    if ! command -v node &> /dev/null; then
        echo "❌ Failed to install Node.js"
        echo "Please manually run: pkg install nodejs"
        exit 1
    fi
    
    echo "✓ Node.js installed successfully"
else
    echo "✓ Node.js already installed: $(node --version)"
fi

echo ""
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

echo ""
if [ ! -f "CONFIG.json" ]; then
    echo "📝 Setting up configuration..."
    cp CONFIG.example.json CONFIG.json
    
    echo ""
    echo "Configuration copied. Please edit CONFIG.json with your settings:"
    echo "  - server.host: Your Minecraft server IP"
    echo "  - server.port: Server port (default: 25565)"
    echo "  - server.version: Minecraft version (e.g., 1.20.1)"
    echo "  - auth.username: Bot username"
    echo "  - auth.type: 'offline', 'microsoft', or 'mojang'"
    echo ""
    
    read -p "Do you want to set a new admin token for the dashboard? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Enter new admin token (or press Enter to keep default):"
        read -r NEW_TOKEN
        
        if [ ! -z "$NEW_TOKEN" ]; then
            if command -v jq &> /dev/null; then
                cat CONFIG.json | jq ".dashboard.adminToken = \"$NEW_TOKEN\"" > CONFIG.tmp && mv CONFIG.tmp CONFIG.json
                echo "✓ Admin token updated"
            else
                echo "⚠️  jq not installed. Please manually edit CONFIG.json to change the admin token"
                echo "   Install jq: pkg install jq"
            fi
        fi
    fi
    
    echo ""
    echo "⚙️  Safety defaults configured:"
    echo "  - Max CPU: 30%"
    echo "  - Max Memory: 512MB"
    echo "  - Max Blocks/Hour: 200"
    echo ""
else
    echo "✓ CONFIG.json already exists"
fi

echo ""
echo "🔧 Checking for PM2..."
if ! command -v pm2 &> /dev/null; then
    read -p "Install PM2 for process management? (recommended) (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g pm2
        
        if [ $? -eq 0 ]; then
            echo "✓ PM2 installed"
        else
            echo "⚠️  PM2 installation failed, will use nohup fallback"
        fi
    fi
else
    echo "✓ PM2 already installed"
fi

echo ""
echo "📂 Creating data directories..."
mkdir -p data/logs data/tasks
echo "✓ Directories created"

echo ""
echo "✅ Installation complete!"
echo ""
echo "📖 Quick Start Guide:"
echo "===================="
echo ""
echo "1. Edit your config:"
echo "   nano CONFIG.json"
echo ""
echo "2. Start with PM2 (recommended):"
echo "   npm run pm2:start"
echo ""
echo "3. Or start directly:"
echo "   npm start              # Start bot"
echo "   npm run dashboard      # Start dashboard only"
echo ""
echo "4. Access dashboard:"
echo "   http://localhost:5000"
echo ""
echo "5. PM2 commands:"
echo "   pm2 logs               # View logs"
echo "   pm2 status             # Check status"
echo "   pm2 restart all        # Restart"
echo "   pm2 stop all           # Stop"
echo ""
echo "6. Run on device boot (PM2):"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "⚠️  Important Notes:"
echo "   - Configure CONFIG.json before starting"
echo "   - Change the dashboard admin token"
echo "   - Monitor device temperature when running 24/7"
echo "   - Bot will auto-throttle if device gets hot"
echo ""
echo "📱 Termux Permissions (if needed):"
echo "   - Battery monitoring: termux-setup-storage"
echo ""
echo "Need help? Check README.md for full documentation"
echo ""
