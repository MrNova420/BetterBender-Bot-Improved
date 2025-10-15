# 🎮 BetterSMP Bot - Complete Setup Guide

**Production-Ready Minecraft Bot - Fully Automated & Stable**

---

## 🚀 Quick Start (3 Methods)

### Method 1: Interactive Setup (Recommended)
```bash
npm run setup
```
Follow the prompts to configure:
- Bot username
- Server IP & port
- Minecraft version  
- Starting mode (Basic or Advanced)
- Account type (Offline, Microsoft, or Mojang)

### Method 2: Command Line Setup
```bash
node quick-config.js <botname> <server-ip> <version> [port] [type] [password]
```

**Examples:**
```bash
# Offline/Cracked server (no password needed)
node quick-config.js MyBot play.example.com 1.20.1

# Microsoft account (uses device code login - no password needed)
node quick-config.js email@outlook.com hypixel.net 1.20.1 25565 microsoft

# Mojang account (legacy - password required)
node quick-config.js username mc.example.com 1.19.4 25565 mojang YourPassword

# Custom port
node quick-config.js MyBot 192.168.1.100 1.20.1 19132 offline
```

### Method 3: Manual Configuration
Edit `config/settings.json`:

```json
{
  "bot-account": {
    "username": "YourBotName",
    "password": "YourPassword",
    "type": "offline"
  },
  "server": {
    "ip": "play.yourserver.com",
    "port": 25565,
    "version": "1.20.1"
  },
  "mode": {
    "current": "basic"
  }
}
```

---

## 🔐 Account Types

### Offline/Cracked Servers
```json
{
  "bot-account": {
    "username": "BotName",
    "password": "",
    "type": "offline"
  }
}
```

### Microsoft Account (Device Code Flow)
```json
{
  "bot-account": {
    "username": "your-email@outlook.com",
    "password": "",
    "type": "microsoft"
  }
}
```
**Note:** Microsoft uses OAuth device code authentication. When bot starts, you'll see a code on screen and in the dashboard. Visit the URL shown and enter the code to authenticate. No password needed in config!

### Mojang Account (Legacy)
```json
{
  "bot-account": {
    "username": "your-username",
    "password": "your-password",
    "type": "mojang"
  }
}
```

---

## 🎮 Operating Modes

### Basic Mode
✅ Anti-AFK movement  
✅ Smart chat responses  
✅ Welcome new players  
✅ Answer questions  
✅ Provide helpful tips  
✅ Auto-reconnect  

**Perfect for:** Keeping servers active, helping players, simple automation

### Advanced Mode
✅ **Everything in Basic Mode, PLUS:**  
⛏️ Automated mining (strip, branch, quarry, vein)  
🏗️ Structure building (houses, towers, mansions)  
🌾 Farming & animal breeding  
🗺️ Exploration & pathfinding  
⚔️ Combat AI & self-defense  
📦 Resource collection  
🤖 Task queue management  

**Perfect for:** Full automation, complex tasks, autonomous gameplay

---

## 📊 Dashboard Control

Access the dashboard at: **http://localhost:5000**

### Features:
- 🔄 Switch between Basic/Advanced modes in real-time
- 📈 Real-time status monitoring
- ⚡ Quick command buttons
- ⛏️ Mining operations (Advanced mode)
- 🏗️ Building controls (Advanced mode)
- 🌾 Farming management (Advanced mode)
- 📋 Task queue visualization
- 📊 Statistics tracking

### Dashboard Commands:
All bot commands work from the dashboard - no need to be in-game!

---

## 🤖 Bot Commands (In-Game)

### Basic Commands (All Modes)
```
!bot status       - Show bot status
!bot come         - Bot comes to you
!bot follow       - Bot follows you
!bot stop         - Stop all tasks
!bot inv          - Show inventory
!bot help         - List all commands
```

### Mode Switching
```
!bot mode basic      - Switch to Basic mode
!bot mode advanced   - Switch to Advanced mode
```

### Mining (Advanced Mode)
```
!bot mine <ore> <amount>           - Mine specific ore
!bot stripmining [depth] [length]  - Start strip mining
!bot branchmining [depth]          - Start branch mining
!bot quarry [size] [depth]         - Create a quarry
!bot veinmine <ore>                - Mine entire ore vein
```

### Building (Advanced Mode)
```
!bot house       - Build a house
!bot tower       - Build a tower
!bot mansion     - Build a mansion
!bot castle      - Build a castle
!bot structures  - List available structures
```

### Farming (Advanced Mode)
```
!bot farm create [x] [y] [z] [size]  - Create farm
!bot farm harvest                    - Harvest all farms
!bot farm auto [duration]            - Auto-farm
!bot breed <animal> <count>          - Breed animals
```

### Other (Advanced Mode)
```
!bot explore [duration]  - Explore area
!bot collect <item> <amount>  - Collect materials
!bot gather <items...>   - Gather multiple items
```

---

## 📱 Termux Setup (Android)

### 1. Install Dependencies
```bash
pkg install nodejs git -y
```

### 2. Get the Bot
```bash
cd ~/storage/downloads
# Clone or copy your bot folder here
cd bettersmp-bot
npm install
```

### 3. Configure
```bash
# Quick setup
node quick-config.js MyBot play.server.com 1.20.1

# Or interactive
npm run setup
```

### 4. Run
```bash
# Foreground (see logs)
npm start

# Background with PM2 (recommended)
npm install -g pm2
pm2 start ecosystem.config.js --only bot-enhanced

# View logs
pm2 logs

# Auto-start on boot
pm2 startup
pm2 save
```

---

## 🛠️ Configuration Options

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

### Owner Controls
Set your Minecraft username to control the bot:

```json
{
  "owner": {
    "username": "YourMinecraftUsername"
  }
}
```

Only the owner can execute bot commands!

### Performance Settings
```json
{
  "device-health": {
    "cpu-throttling": {
      "enabled": true,
      "max-cpu-percent": 25
    },
    "memory-limits": {
      "max-memory-mb": 150
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
      "varied-patterns": true
    }
  }
}
```

---

## 🔧 Troubleshooting

### Bot Won't Connect
✅ Check server IP is correct (not "localhost")  
✅ Verify Minecraft version matches server  
✅ For online servers, use correct account type  
✅ Check firewall/network settings  

### Authentication Failed
✅ **Offline servers:** Use `"type": "offline"`, leave password empty  
✅ **Microsoft:** Use email, set `"type": "microsoft"`, authenticate via device code when bot starts  
✅ **Mojang:** Use username and password, set `"type": "mojang"`  

### Bot Gets Kicked
✅ Enable auto-auth if server requires `/register` or `/login`  
✅ Check anti-AFK settings aren't too aggressive  
✅ Verify bot username isn't already in use  

### Dashboard Not Loading
✅ Check port 5000 is available  
✅ Verify bot is running: `pm2 status`  
✅ Check logs: `pm2 logs` or workflow logs  

### Memory Issues
✅ Reduce max memory in config  
✅ Enable aggressive cleanup  
✅ Use Basic mode instead of Advanced  

---

## 📦 NPM Scripts

```bash
npm start          # Start bot (uses saved config)
npm run setup      # Interactive setup wizard
npm run config     # Quick command-line config
npm run enhanced   # Start bot directly

# PM2 Management
npm run pm2        # Start with PM2
npm run pm2:stop   # Stop bot
npm run pm2:restart # Restart bot
npm run pm2:logs   # View logs
npm run pm2:status # Check status
```

---

## 🌟 Features Overview

### Reliability
- ✅ Auto-reconnect (up to 100 attempts)
- ✅ Exponential backoff
- ✅ Error recovery
- ✅ Memory management
- ✅ Graceful shutdown

### Intelligence
- ✅ Context-aware chat responses (200+ messages)
- ✅ Player conversation memory
- ✅ Smart movement patterns
- ✅ Adaptive behavior

### Automation
- ✅ Autonomous task execution
- ✅ Task queue management
- ✅ Priority-based scheduling
- ✅ Multi-task coordination

### Monitoring
- ✅ Real-time dashboard
- ✅ Health metrics
- ✅ Performance tracking
- ✅ Activity logging

---

## 🔒 Security Best Practices

1. **Never share your password** in config files that are committed to git
2. **Use environment variables** for sensitive data (if deploying publicly)
3. **Set a strong owner username** to prevent unauthorized commands
4. **Keep your bot account separate** from your main Minecraft account
5. **Regularly update** the bot and dependencies

---

## 📚 Additional Resources

- **Dashboard:** http://localhost:5000
- **Enhanced Dashboard:** http://localhost:5000/dashboard.html
- **Configuration:** `config/settings.json`
- **Logs:** `logs/` directory or `pm2 logs`

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Setup bot** | `npm run setup` |
| **Start bot** | `npm start` |
| **Quick config** | `node quick-config.js <name> <ip> <version>` |
| **Change mode** | Dashboard or `!bot mode <basic/advanced>` |
| **View status** | http://localhost:5000 |
| **Stop bot** | `!bot stop` or `pm2 stop all` |
| **View logs** | `pm2 logs` |

---

## ✅ Checklist for First Run

- [ ] Node.js installed (v22+ recommended)
- [ ] Dependencies installed (`npm install`)
- [ ] Bot configured (username, server, version)
- [ ] Account type set correctly (offline/microsoft/mojang)
- [ ] Owner username set in config
- [ ] Server is online and accessible
- [ ] Dashboard loads at http://localhost:5000
- [ ] Bot connects successfully
- [ ] Commands work from dashboard or in-game

---

**Your bot is ready! 🚀**

For advanced features, switch to **Advanced Mode** via dashboard or `!bot mode advanced`

Enjoy your 24/7 Minecraft automation! 🎮
