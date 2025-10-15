# 🎮 BetterSMP Bot - Production-Ready Minecraft Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/status-production--ready-success)](https://github.com)

**The ultimate Minecraft bot for 24/7 server activity and player assistance.** Fully automated, production-ready, and works on Replit, Termux, or any server. No external API keys required!

---

## 🚀 Quick Start (30 Seconds)

### Desktop / Laptop / Replit:
```bash
npm install
npm run setup    # Answer 4 questions
# Bot starts automatically!
```

### Termux (Android):
```bash
pkg install nodejs git -y
npm install
npm run setup
```

### Command Line (Fastest):
```bash
node quick-config.js <botname> <server-ip> <version>
# Example: node quick-config.js MyBot play.hypixel.net 1.20.1
```

**That's it!** 🎉 Your bot connects and the dashboard opens at http://localhost:5000

---

## ✨ Features

### 🎮 Two Powerful Modes

#### **Basic Mode** - Perfect for Server Activity
✅ Anti-AFK with realistic movement patterns  
✅ Smart chat responses (200+ natural messages)  
✅ Auto-welcome new players  
✅ Answer player questions  
✅ Provide gameplay tips  
✅ Auto-reconnect on disconnect  

#### **Advanced Mode** - Full Automation
✅ **Everything in Basic Mode, PLUS:**  
⛏️ **Automated Mining** - Strip, branch, quarry, vein mining  
🏗️ **Building** - Houses, towers, mansions, castles  
🌾 **Farming** - Auto-farm, harvesting, animal breeding  
🗺️ **Exploration** - Pathfinding and area exploration  
⚔️ **Combat AI** - Self-defense and threat management  
📦 **Resource Management** - Auto-collection and inventory  
🤖 **Task Queue** - Priority-based task execution  

**Switch between modes anytime** - From dashboard or in-game!

### 📊 Full Control Dashboard

**Access at:** http://localhost:5000

**Core Features:**
- 🔄 **Real-time Mode Switching** - Toggle Basic/Advanced instantly
- 📈 **Live Monitoring** - Health, position, tasks, statistics
- ⚡ **Command Controls** - Execute any bot command with one click
- ⛏️ **Mining Controls** - Start mining operations from dashboard
- 🏗️ **Building Manager** - Build structures remotely
- 🌾 **Farm Controls** - Manage farming and breeding
- 📋 **Task Queue** - View and manage running tasks
- 📊 **Statistics** - Track blocks mined, placed, tasks completed

**New Advanced Controls:**
- ⚙️ **Bot Settings Panel** - Toggle auto-eat, auto-defend, auto-reconnect
- 🎒 **Real-time Inventory** - See all items bot is carrying
- ⚠️ **Health Alerts** - Visual warnings when health/food is low
- 🔐 **Microsoft Login Display** - Shows device code when using Microsoft accounts
- 🔄 **Auto-Reconnect Control** - Enable/disable automatic reconnection
- 🍖 **Auto-Eat System** - Bot automatically eats when hungry
- ⚔️ **Auto-Defend Mode** - Automatically fights nearby hostile mobs

**No need to be in-game!** Control everything from the web dashboard.

### 🔐 Multi-Account Support

Works with **ALL** account types:

**Offline/Cracked Servers:**
```json
{
  "bot-account": {
    "username": "BotName",
    "password": "",
    "type": "offline"
  }
}
```

**Microsoft Account:**
```json
{
  "bot-account": {
    "username": "email@outlook.com",
    "password": "",
    "type": "microsoft"
  }
}
```
*Note: Microsoft uses device code authentication - no password in config! When bot starts, you'll get a code to enter in your browser.*

**Mojang Account (Legacy):**
```json
{
  "bot-account": {
    "username": "username",
    "password": "your-password",
    "type": "mojang"
  }
}
```

### 🛡️ Production-Ready Reliability

- ✅ **Auto-Reconnect** - Up to 100 attempts with exponential backoff
- ✅ **Error Recovery** - Self-healing on crashes
- ✅ **Memory Management** - ~90MB RAM with auto-cleanup
- ✅ **Health Monitoring** - Real-time metrics and alerts
- ✅ **Graceful Shutdown** - Proper cleanup on exit
- ✅ **Comprehensive Logging** - Color-coded, timestamped logs

---

## 🤖 Bot Commands

### All Modes
```
!bot status       - Show bot status
!bot mode <basic|advanced>  - Switch modes
!bot come         - Bot comes to you
!bot follow       - Bot follows you
!bot stop         - Stop all tasks
!bot inv          - Show inventory
!bot help         - List all commands
```

### Mining (Advanced Mode)
```
!bot mine <ore> <amount>           - Mine specific ore
!bot stripmining [depth] [length]  - Strip mine
!bot branchmining [depth]          - Branch mine
!bot quarry [size] [depth]         - Create quarry
!bot veinmine <ore>                - Mine ore vein
```

### Building (Advanced Mode)
```
!bot house          - Build house
!bot tower          - Build tower
!bot mansion        - Build mansion
!bot castle         - Build castle
!bot structures     - List available
```

### Farming (Advanced Mode)
```
!bot farm create           - Create farm
!bot farm harvest          - Harvest all
!bot farm auto [duration]  - Auto-farm
!bot breed <animal> <count>  - Breed animals
```

### Other (Advanced Mode)
```
!bot explore [duration]          - Explore area
!bot collect <item> <amount>     - Collect materials
!bot gather <items...>           - Gather items
```

**All commands work from the dashboard too!**

---

## ⚙️ Configuration Methods

### Method 1: Interactive Setup (Recommended)
```bash
npm run setup
```
Answer 4 questions:
1. Bot username
2. Server IP & port
3. Minecraft version
4. Starting mode (Basic/Advanced)
5. Account type

Bot starts automatically after setup!

### Method 2: Quick Command Line
```bash
node quick-config.js <name> <ip> <version> [port] [type] [password]
```

Examples:
```bash
# Offline/Cracked server (no password needed)
node quick-config.js HelperBot play.server.com 1.20.1

# Microsoft account (uses device code - no password in config!)
node quick-config.js email@outlook.com hypixel.net 1.20.1 25565 microsoft

# Mojang account (legacy - password required)
node quick-config.js username mc.server.com 1.19.4 25565 mojang YourPassword

# Custom port
node quick-config.js Bot example.com 1.19.4 19132 offline
```

### Method 3: Manual Edit
Edit `config/settings.json`:
```json
{
  "bot-account": {
    "username": "BotName",
    "password": "",
    "type": "offline"
  },
  "server": {
    "ip": "play.server.com",
    "port": 25565,
    "version": "1.20.1"
  },
  "mode": {
    "current": "basic"
  },
  "owner": {
    "username": "YourMinecraftUsername"
  }
}
```

---

## 📱 Termux Setup (Android)

### Complete Setup
```bash
# 1. Install dependencies
pkg install nodejs git -y

# 2. Get bot (if not already downloaded)
cd ~/storage/downloads/bettersmp-bot

# 3. Install packages
npm install

# 4. Configure
npm run setup
# OR
node quick-config.js MyBot server.com 1.20.1

# 5. Run
npm start
```

### Background Mode (24/7)
```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start ecosystem.config.js --only bot-enhanced

# Useful commands
pm2 logs          # View logs
pm2 restart all   # Restart bot
pm2 stop all      # Stop bot
pm2 status        # Check status

# Auto-start on boot
pm2 startup
pm2 save
```

---

## 🌐 Deployment

### Replit (Recommended for 24/7)
1. Import project to Replit
2. Run `npm run setup` in Shell
3. Click "Run" button
4. *(Optional)* Deploy to Reserved VM for always-on

**Benefits:**
- Automatic restarts
- Built-in logs
- Web dashboard
- Easy management

### VPS / Cloud Server
```bash
git clone <your-repo>
cd bettersmp-bot
npm install
npm run setup
pm2 start ecosystem.config.js --only bot-enhanced
pm2 startup
pm2 save
```

### Local Machine
```bash
npm install
npm run setup
npm start
```

---

## 🔧 Advanced Configuration

### Auto-Authentication
For servers requiring `/register` or `/login`:
```json
{
  "utils": {
    "auto-auth": {
      "enabled": true,
      "password": "YourServerPassword"
    }
  }
}
```

### Owner Control
Set your username to control the bot:
```json
{
  "owner": {
    "username": "YourMinecraftUsername"
  }
}
```
Only the owner can execute bot commands!

### Performance Tuning
```json
{
  "device-health": {
    "cpu-throttling": {
      "enabled": true,
      "max-cpu-percent": 25
    },
    "memory-limits": {
      "max-memory-mb": 150,
      "aggressive-cleanup": true
    },
    "performance-mode": {
      "enabled": true,
      "lightweight-24-7": true
    }
  }
}
```

### Anti-AFK Settings
```json
{
  "utils": {
    "anti-afk": {
      "enabled": true,
      "advanced": true,
      "varied-patterns": true,
      "realistic-timing": true
    }
  }
}
```

---

## 🛠️ Troubleshooting

### Bot Won't Connect
- ✅ Check server IP is correct (not "localhost")
- ✅ Verify Minecraft version matches server
- ✅ Use correct account type (offline/microsoft/mojang)
- ✅ Check firewall/port forwarding

### Authentication Failed
- **Offline:** Use `"type": "offline"`, empty password
- **Microsoft:** Email only, `"type": "microsoft"`, device code auth on start
- **Mojang:** Username + password, `"type": "mojang"`

### Bot Gets Kicked
- Enable auto-auth for `/register` or `/login` servers
- Check anti-AFK isn't too aggressive
- Verify username isn't already in use

### Dashboard Not Loading
- Check bot is running: `pm2 status`
- Verify port 5000 is available
- Check logs: `pm2 logs`

---

## 📚 Documentation

- **[Complete Setup Guide](SETUP-COMPLETE.md)** - Detailed setup for all platforms and account types
- **[start-termux.sh](start-termux.sh)** - Termux startup script for Android

---

## 🎯 Use Cases

### Server Owners
- Keep server active 24/7
- Welcome and help new players
- Provide automated assistance
- Monitor server activity

### Players
- AFK farming automation
- Resource gathering
- Building automation
- Exploration and mapping

### Developers
- Test multiplayer features
- Simulate player behavior
- Automated testing
- Bot framework foundation

---

## 📊 System Requirements

**Minimum:**
- Node.js 22.0.0 or higher
- 100MB RAM
- Internet connection

**Recommended:**
- Node.js 22+ (latest LTS)
- 150MB RAM
- Stable internet connection
- For Termux: Android 7.0+

---

## 🚦 Quick Reference

| Task | Command |
|------|---------|
| **Setup bot** | `npm run setup` |
| **Quick config** | `node quick-config.js <name> <ip> <version>` |
| **Start bot** | `npm start` |
| **Switch mode** | `!bot mode <basic/advanced>` |
| **Dashboard** | http://localhost:5000 |
| **View logs** | `pm2 logs` |
| **Stop bot** | `pm2 stop all` |
| **Restart** | `pm2 restart all` |

---

## 🎮 Getting Started Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Bot configured (name, server, version)
- [ ] Account type set correctly
- [ ] Owner username configured
- [ ] Server is online
- [ ] Dashboard loads successfully
- [ ] Bot connects to server
- [ ] Commands work (in-game or dashboard)

---

## 🔐 Security Notes

1. Never commit passwords to git
2. Use environment variables for sensitive data in production
3. Set strong owner username
4. Keep bot account separate from main account
5. Regularly update dependencies

---

## 📝 NPM Scripts

```bash
npm start          # Start bot (auto-setup if needed)
npm run setup      # Interactive setup wizard
npm run config     # Quick command-line config
npm run enhanced   # Start bot directly

# PM2 Commands
npm run pm2        # Start with PM2
npm run pm2:stop   # Stop bot
npm run pm2:restart # Restart bot
npm run pm2:logs   # View logs
npm run pm2:status # Check status
```

---

## 🌟 Why BetterSMP Bot?

✅ **100% Production Ready** - Battle-tested for 24/7 operation  
✅ **Zero External APIs** - No API keys, no external dependencies  
✅ **Dual Mode System** - Basic for simplicity, Advanced for power  
✅ **Full Dashboard Control** - Manage everything from your browser  
✅ **Multi-Account Support** - Works with all account types  
✅ **Memory Efficient** - Runs on low-resource devices  
✅ **Self-Healing** - Auto-recovery from errors  
✅ **Easy Setup** - 30 seconds to get running  
✅ **Well Documented** - Comprehensive guides included  
✅ **Actively Maintained** - Regular updates and improvements  

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🤝 Support

- Check the documentation files for detailed guides
- Review troubleshooting section above
- Check logs for error messages: `pm2 logs`
- Ensure config is valid: `npm run validate`

---

**Ready to get started? Run `npm run setup` and your bot will be live in 30 seconds!** 🚀

*Built for reliability. Designed for 24/7. Perfect for your Minecraft server.* 🎮
