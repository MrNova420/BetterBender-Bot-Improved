# 🎮 Complete Setup Guide - BetterBender 2.0

## 📋 Table of Contents
1. [Quick Setup (5 Minutes)](#quick-setup)
2. [Server Configuration](#server-configuration)
3. [Account Setup](#account-setup)
4. [Player Mode Configuration](#player-mode)
5. [24/7 Deployment](#247-deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Setup

### Step 1: Install & Start
```bash
# Already have Node.js installed? Start immediately:
node dashboard/server.js CONFIG.json
```

### Step 2: Configure Server
Edit `CONFIG.json` and change:
```json
{
  "server": {
    "host": "YOUR_SERVER_HERE",    // ← Change this!
    "port": 25565,
    "version": "1.20.1"             // ← Match your server version
  }
}
```

### Step 3: Access Dashboard
Open: **http://localhost:5000**
- No login required for localhost!
- Full control panel
- Real-time monitoring

**Done! Your bot is running!** 🎉

---

## 🌐 Server Configuration

### Finding Your Server Details

**If you have a server name** (like `play.hypixel.net`):
```json
{
  "server": {
    "host": "play.hypixel.net",
    "port": 25565,
    "version": "1.20.1"
  }
}
```

**If you have an IP address** (like `192.168.1.100`):
```json
{
  "server": {
    "host": "192.168.1.100",
    "port": 25565,
    "version": "1.19.4"
  }
}
```

**If server uses a different port** (like `:19132`):
```json
{
  "server": {
    "host": "play.example.com",
    "port": 19132,
    "version": "1.20.1"
  }
}
```

### Version Compatibility
The bot works with Minecraft Java Edition versions:
- ✅ 1.20.x (Latest)
- ✅ 1.19.x
- ✅ 1.18.x
- ✅ 1.17.x
- ✅ 1.16.x
- ✅ 1.12.2 (Older servers)

**Tip**: Match the version in CONFIG.json to your server's version!

---

## 🔐 Account Setup

### Offline/Cracked Servers (Easiest)
```json
{
  "auth": {
    "type": "offline",
    "username": "YourBotName",
    "password": ""
  }
}
```
✅ No authentication needed
✅ Works on cracked servers
✅ Choose any username

### Microsoft Account (Official Minecraft)
```json
{
  "auth": {
    "type": "microsoft",
    "username": "your-email@example.com",
    "password": ""
  }
}
```
When you start the bot:
1. Watch the console for a link
2. Open the link in your browser
3. Enter the code shown
4. Login with your Microsoft account
5. Bot connects automatically!

### Mojang Account (Legacy)
```json
{
  "auth": {
    "type": "mojang",
    "username": "your-minecraft-username",
    "password": "your-password"
  }
}
```
⚠️ Only for pre-migration Mojang accounts

---

## 🎮 Player Mode Configuration

### Enable Full Autonomous Player
```json
{
  "mode": {
    "current": "player",        // ← Change from "afk" to "player"
    "autoSwitch": false
  }
}
```

### Player Capabilities

The bot can automatically:
- ✅ **Mine resources** - Finds and mines ores, logs, etc.
- ✅ **Build structures** - Constructs shelters and buildings
- ✅ **Craft items** - Creates tools and items from materials
- ✅ **Fight mobs** - Defends itself when attacked
- ✅ **Collect items** - Picks up drops automatically
- ✅ **Use chests** - Stores items in nearby chests
- ✅ **Trade with villagers** - Finds and trades automatically
- ✅ **Explore world** - Navigates and discovers new areas
- ✅ **Respond to chat** - Natural chat interaction
- ✅ **Help other players** - Shares resources and assists

### Fine-Tune Player Behavior

**Conservative (Safe for weak servers)**:
```json
{
  "playerMode": {
    "maxBlocksPerCycle": 50,
    "workDuration": 1800000,     // 30 minutes work
    "restDuration": 600000,      // 10 minutes rest
    "smartInventory": true,
    "useChests": true
  }
}
```

**Aggressive (Maximum productivity)**:
```json
{
  "playerMode": {
    "maxBlocksPerCycle": 200,
    "workDuration": 3600000,     // 1 hour work
    "restDuration": 300000,      // 5 minutes rest
    "smartInventory": true,
    "useChests": true,
    "helpPlayers": true,
    "buildCommunity": true
  }
}
```

---

## 🔄 24/7 Deployment

### For Linux/Mac/Replit

**Using the included script**:
```bash
./start.sh
```

**Manual PM2 setup**:
```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start ecosystem.config.js

# Monitor
pm2 status
pm2 logs

# Auto-start on system boot
pm2 startup
pm2 save
```

### For Android/Termux

**Install Termux from F-Droid**:
```bash
# Update packages
pkg update && pkg upgrade

# Install Node.js
pkg install nodejs-lts

# Install bot dependencies
npm install

# Start bot
node dashboard/server.js CONFIG.json

# Keep running in background
# Press Ctrl+Z, then type:
bg
disown
```

**Keep Termux alive**:
1. Go to Android Settings
2. Battery → BetterBender (Termux)
3. Set to "No restrictions"
4. Enable "Allow background activity"

### For Windows

**Create `start.bat`**:
```batch
@echo off
:loop
node dashboard/server.js CONFIG.json
timeout /t 10
goto loop
```

Double-click `start.bat` to run!

---

## 🛡️ Long-Term Stability

### Safety Settings for 24/7 Operation

**Low-End Device (Old phone)**:
```json
{
  "safety": {
    "maxCpuPercent": 30,
    "maxMemoryMB": 256,
    "checkIntervalMs": 60000
  }
}
```

**Medium Device (Modern phone)**:
```json
{
  "safety": {
    "maxCpuPercent": 45,
    "maxMemoryMB": 512,
    "checkIntervalMs": 45000
  }
}
```

**High-End (PC/Server)**:
```json
{
  "safety": {
    "maxCpuPercent": 60,
    "maxMemoryMB": 1024,
    "checkIntervalMs": 30000
  }
}
```

### Auto-Reconnect Configuration
```json
{
  "reconnect": {
    "enabled": true,
    "maxAttempts": 75,           // Try 75 times before giving up
    "initialDelayMs": 5000,      // Start with 5 second delay
    "maxDelayMs": 60000,         // Max 1 minute between attempts
    "backoffMultiplier": 1.5     // Gradually increase delay
  }
}
```

### Battery Protection (Termux/Android)
```json
{
  "safety": {
    "enableBatteryMonitoring": true,
    "enableThermalMonitoring": true
  }
}
```
Bot will automatically reduce activity when:
- Battery < 20%
- Temperature > 60°C

---

## 🔧 Troubleshooting

### Bot Won't Connect

**Check 1: Server Address**
```bash
# Test if server is reachable
ping your-server.com
```

**Check 2: Server Online**
- Is the Minecraft server actually running?
- Can you connect with your regular Minecraft client?

**Check 3: Version Match**
- Does CONFIG.json version match server version?
- Try changing version to match exactly

**Check 4: Firewall**
```bash
# Check if port is open
telnet your-server.com 25565
```

### High CPU Usage

**Solution 1: Lower the limit**
```json
{
  "safety": {
    "maxCpuPercent": 30
  }
}
```

**Solution 2: Use AFK mode**
```json
{
  "mode": {
    "current": "afk"
  }
}
```

**Solution 3: Increase intervals**
```json
{
  "afkMode": {
    "movementInterval": 60000,
    "statusUpdateInterval": 180000
  }
}
```

### Bot Keeps Disconnecting

**Enable auto-reconnect**:
```json
{
  "reconnect": {
    "enabled": true,
    "maxAttempts": 100
  }
}
```

**Check server rules**:
- Does server allow bots?
- Are you getting kicked for AFK?
- Is there an anti-bot plugin?

### Dashboard Won't Load

**Fix 1: Check port**
```bash
# Make sure port 5000 is free
lsof -i :5000
```

**Fix 2: Try different port**
```json
{
  "dashboard": {
    "port": 3000
  }
}
```

**Fix 3: Access directly**
```
http://localhost:5000
http://127.0.0.1:5000
http://[your-ip]:5000
```

### Memory Leaks / Crashes

**Fix 1: Lower memory limit**
```json
{
  "safety": {
    "maxMemoryMB": 256
  }
}
```

**Fix 2: Disable logging**
```json
{
  "logging": {
    "logToFile": false
  }
}
```

**Fix 3: Use PM2 auto-restart**
```bash
pm2 start ecosystem.config.js --max-memory-restart 300M
```

---

## 📊 Monitoring Your Bot

### Dashboard Features

**Main Status Panel**:
- ❤️ Health & food levels
- 📍 Position (X, Y, Z)
- 🎯 Current activity
- 📈 Performance metrics

**Control Panel**:
- ▶️ Start/stop bot
- 🔄 Switch modes
- 📝 Send commands
- ⚙️ Toggle features

**Activity History**:
- Mining operations
- Combat encounters  
- Chat messages
- Trades completed

### Console Monitoring

Watch real-time logs:
```bash
# If using PM2
pm2 logs

# If running directly
# Logs appear in console
```

Look for:
- ✅ `[INFO] Bot connected`
- ✅ `[INFO] Safety monitor started`
- ⚠️ `[WARN] CPU usage high`
- ❌ `[ERROR] Connection failed`

---

## 🎯 Recommended Configs

### AFK Only (Minimal Resources)
```json
{
  "mode": { "current": "afk" },
  "safety": {
    "maxCpuPercent": 30,
    "maxMemoryMB": 256
  },
  "afkMode": {
    "movementInterval": 30000,
    "movementRange": 3
  }
}
```

### Resource Gatherer
```json
{
  "mode": { "current": "player" },
  "playerMode": {
    "maxBlocksPerCycle": 150,
    "workDuration": 1800000,
    "autoMine": true,
    "useChests": true
  }
}
```

### Social Bot
```json
{
  "mode": { "current": "player" },
  "playerMode": {
    "respondToChat": true,
    "helpPlayers": true,
    "buildCommunity": true,
    "socialDuration": 1800000
  }
}
```

### Builder Bot
```json
{
  "mode": { "current": "player" },
  "playerMode": {
    "buildCommunity": true,
    "useChests": true,
    "smartInventory": true,
    "maxBlocksPerCycle": 200
  }
}
```

---

## 🔗 Additional Resources

- **README.md** - Full documentation
- **OPTIMIZATION.md** - Performance tuning
- **TESTING.md** - Testing procedures  
- **CONFIG-PRESETS.json** - Ready-to-use configs
- **PRODUCTION-READY.md** - Deployment checklist

---

## ✅ Pre-Flight Checklist

Before running 24/7:

- [ ] Server address configured
- [ ] Account type set correctly
- [ ] Bot mode selected (afk/player)
- [ ] Safety limits set for your device
- [ ] Auto-reconnect enabled
- [ ] Dashboard accessible
- [ ] Logs monitored
- [ ] PM2/Termux configured for persistence

**Once configured, your bot can run for months without intervention!**

---

**Need help? Check the documentation or open an issue!** 🚀
