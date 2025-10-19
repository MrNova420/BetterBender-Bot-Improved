# 🚀 BetterBender 2.0 - Installation Guide

## ⚡ Quick Install (3 Commands)

```bash
# 1. Clone or download the project
git clone <your-repo-url>
cd BetterBender-2.0

# 2. Install dependencies
npm install

# 3. Run automatic setup
npm run setup
```

**That's it!** The setup script will:
- ✅ Check Node.js version
- ✅ Install all dependencies
- ✅ Create necessary directories
- ✅ Generate configuration
- ✅ Set up everything automatically

Then just run:
```bash
npm start
```

---

## 📋 System Requirements

### Required
- **Node.js 18+** (Download: https://nodejs.org/)
- **100MB disk space**
- **256MB RAM minimum** (512MB recommended)
- **Internet connection** (for Minecraft server)

### Supported Platforms
- ✅ Windows 10/11
- ✅ macOS (Intel & Apple Silicon)
- ✅ Linux (Ubuntu, Debian, Fedora, Arch, etc.)
- ✅ Android (via Termux)
- ✅ Replit / Cloud platforms

---

## 🎮 Supported Minecraft Servers

**Works with ANY Minecraft Java Edition server:**

### ✅ Server Types
- Vanilla (official Minecraft server)
- Paper / Spigot
- Fabric
- Forge
- Purpur
- Any custom modded server

### ✅ Versions
- Auto-detects server version
- Works from 1.8 to 1.21+
- Adapts to server protocol automatically

### ✅ Modes
- Online mode (with Microsoft account)
- Offline mode (no account needed)
- Cracked servers
- Premium servers

---

## 📝 Manual Installation (Advanced)

If you prefer manual setup:

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Directories
```bash
mkdir -p data/logs data/civilization config data/backups
```

### 3. Create CONFIG.json

**For Single Bot:**
```json
{
  "server": {
    "host": "localhost",
    "port": 25565,
    "version": "1.20.1"
  },
  "bot": {
    "username": "BetterBot",
    "auth": "offline"
  },
  "modes": {
    "defaultMode": "player",
    "player": {
      "enabled": true,
      "autoEat": true,
      "autoDefend": true,
      "autoBuild": true
    }
  },
  "safety": {
    "autoReconnect": true,
    "maxReconnectAttempts": 10
  },
  "dashboard": {
    "port": 5000,
    "adminToken": "your-secure-token-here"
  }
}
```

### 4. Run
```bash
npm start
```

---

## 🔧 Configuration Options

### Server Settings
```json
{
  "server": {
    "host": "play.example.com",  // Server address
    "port": 25565,                // Server port
    "version": "1.20.1"           // Minecraft version (auto-detects if wrong)
  }
}
```

### Authentication
```json
{
  "bot": {
    "username": "MyBot",
    "auth": "offline"  // or "microsoft" for premium accounts
  }
}
```

### Modes
```json
{
  "modes": {
    "defaultMode": "player",  // "afk" or "player"
    "player": {
      "enabled": true,
      "autoEat": true,          // Auto-eat when hungry
      "autoDefend": true,       // Fight back when attacked
      "autoBuild": true         // Build homes automatically
    }
  }
}
```

---

## 🌐 Network Configuration

### Local Server (Same Computer)
```json
{
  "server": {
    "host": "localhost",
    "port": 25565
  }
}
```

### Remote Server (Internet)
```json
{
  "server": {
    "host": "play.myserver.com",
    "port": 25565
  }
}
```

### LAN Server (Local Network)
```json
{
  "server": {
    "host": "192.168.1.100",
    "port": 25565
  }
}
```

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "EADDRINUSE" port errors
Change the dashboard port in CONFIG.json:
```json
{
  "dashboard": {
    "port": 5001  // Try a different port
  }
}
```

### Connection failures
1. Check server is running
2. Verify host and port are correct
3. Ensure firewall allows connections
4. Try offline mode if authentication fails

### Bot crashes on join
1. Check Minecraft version matches server
2. Verify server allows your username
3. Check server is in offline mode (for offline auth)

---

## 📱 Platform-Specific Setup

### Windows
```powershell
# Install Node.js from nodejs.org
# Then in PowerShell or CMD:
npm install
npm run setup
npm start
```

### macOS
```bash
# Install Node.js
brew install node

# Setup
npm install
npm run setup
npm start
```

### Linux (Ubuntu/Debian)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup
npm install
npm run setup
npm start
```

### Termux (Android)
```bash
# Install Node.js
pkg install nodejs-lts

# Setup
npm install
npm run setup
npm start
```

---

## 🚀 Quick Start After Install

### Interactive Launcher
```bash
npm start
# Then choose: 1 (Single Bot) or 2 (Civilization)
```

### Direct Launch
```bash
npm run bot           # Single bot
npm run civilization  # Civilization (interactive)
npm run civ:tiny      # 5 bots
npm run civ:small     # 10 bots
```

---

## 📚 Next Steps

After installation:
1. ✅ **Test the bot** - Join your server and watch it work
2. ✅ **Read README.md** - Full feature documentation
3. ✅ **Try civilization mode** - See AI societies form
4. ✅ **Customize settings** - Edit CONFIG.json for your needs

---

## 💡 Tips

- Start with **Single Bot Mode** to learn the system
- Use **offline auth** for testing (no account needed)
- Try **civ:tiny** preset first (only 5 bots)
- Check **dashboards** for real-time monitoring
- Bot works on **any server** - modded or vanilla

---

## 🆘 Need Help?

- Check **README.md** for features
- Read **CIVILIZATION_QUICK_START.md** for civilization mode
- Review **CONFIG.json** for settings
- Test on localhost first before remote servers

---

**Ready to start? Run `npm start` and enjoy! 🎉**
