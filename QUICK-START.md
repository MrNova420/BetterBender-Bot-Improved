# 🚀 Quick Start Guide - BetterBender 2.0

## Get Started in 3 Minutes!

### Step 1: Configure Your Server (30 seconds)

Edit `CONFIG.json`:

```json
{
  "server": {
    "host": "your-server.com",
    "port": 25565,
    "version": "1.20.1"
  },
  "account": {
    "type": "offline",
    "username": "YourBotName"
  }
}
```

**Account Types:**
- `offline` - For cracked/offline servers (no password needed)
- `microsoft` - For official Minecraft (uses browser login)
- `mojang` - For legacy Mojang accounts (username + password)

### Step 2: Start the Bot (10 seconds)

```bash
node dashboard/server.js CONFIG.json
```

You'll see:
```
[INFO] Safety monitor started
[INFO] Connecting to your-server.com:25565
[Dashboard] Server running on http://0.0.0.0:5000
```

### Step 3: Open Dashboard (5 seconds)

Open your browser to: **http://localhost:5000**

You'll see:
- 📊 Real-time bot status
- 🎮 Health, food, position
- 🎛️ Control panel
- 📈 Performance metrics

**That's it! Your bot is running!** 🎉

---

## 📱 For Android/Termux Users

### Install Dependencies
```bash
pkg install nodejs-lts git
git clone your-repo-url
cd BetterBender
npm install
```

### Choose Performance Preset

Your device needs the right settings to avoid overheating:

**For older phones** (copy from CONFIG-PRESETS.json):
```json
{
  "safety": {
    "maxCpuPercent": 30,
    "maxMemoryMB": 256
  }
}
```

**For modern phones** (default - already set):
```json
{
  "safety": {
    "maxCpuPercent": 45,
    "maxMemoryMB": 512
  }
}
```

### Start on Termux
```bash
node dashboard/server.js CONFIG.json
```

Keep Termux running in background - your bot will run 24/7!

---

## 🎮 Bot Modes

### AFK Mode (Default)
- Minimal CPU/battery usage
- Prevents AFK kicks
- Random movements (jump, sneak, look around)
- Perfect for staying online

### Player Mode  
- Full autonomous behavior
- Explores, mines, builds
- Higher CPU usage
- Real player simulation

**Switch modes in the dashboard!**

---

## 📊 Dashboard Features

### Main Panel
- ❤️ Health & Food levels
- 📍 Current position (X, Y, Z)
- 🏃 Current activity
- 📈 CPU & Memory usage

### Control Panel
- ▶️ Start/Stop bot
- 🔄 Switch AFK ↔ Player mode
- 📝 Execute commands
- ⚙️ Toggle settings

### Settings
- 🍖 Auto-eat (when hungry)
- ⚔️ Auto-defend (when attacked)
- 🔄 Auto-reconnect (if disconnected)
- 🚨 Health alerts (when low)

---

## ⚙️ Performance Settings

### Low-End Devices (Old phones, <3GB RAM)
```json
{
  "safety": {
    "maxCpuPercent": 30,
    "maxMemoryMB": 256,
    "checkIntervalMs": 60000
  },
  "mode": {
    "current": "afk"
  }
}
```

### Medium Devices (Modern phones, 3-6GB RAM)
```json
{
  "safety": {
    "maxCpuPercent": 45,
    "maxMemoryMB": 512,
    "checkIntervalMs": 45000
  }
}
```

### High-End (Gaming phones/PCs, 6GB+ RAM)
```json
{
  "safety": {
    "maxCpuPercent": 60,
    "maxMemoryMB": 1024,
    "checkIntervalMs": 30000
  }
}
```

**See `CONFIG-PRESETS.json` for complete presets!**

---

## 🔧 Troubleshooting

### "Connection Refused" Error
✅ **Normal!** This happens when the Minecraft server is offline.
- The bot will automatically retry with smart delays
- Once server is online, it connects automatically

### High CPU Usage
1. Make sure you're using the right preset for your device
2. Switch to AFK mode (uses less CPU)
3. Lower `maxCpuPercent` in CONFIG.json

### Bot Disconnects
1. Check your internet connection
2. Make sure server allows your bot
3. Enable auto-reconnect in settings

### Dashboard Not Loading
1. Make sure bot is running
2. Open http://localhost:5000
3. Check firewall settings

---

## 📁 Project Structure

```
BetterBender/
├── src/               # Core bot code
│   ├── core/         # Safety, logging, state
│   └── utils/        # Helper utilities
├── addons/           # Bot plugins (afk, player, mining, etc.)
├── dashboard/        # Web control panel
├── config/           # Config templates
├── CONFIG.json       # Your settings ← EDIT THIS
├── CONFIG-PRESETS.json  # Device presets
└── Documentation:
    ├── README.md          # Full documentation
    ├── QUICK-START.md     # This file
    ├── OPTIMIZATION.md    # Performance guide
    ├── TESTING.md         # Testing procedures
    ├── CHANGELOG.md       # Version history
    └── PRODUCTION-READY.md # Deployment guide
```

---

## 🛡️ Safety Features

Your device is protected:
- ✅ **CPU Monitoring** - Throttles when CPU too high
- ✅ **Memory Limits** - Prevents memory overflow
- ✅ **Thermal Protection** - Monitors temperature (Termux)
- ✅ **Battery Awareness** - Reduces activity on low battery
- ✅ **Smart Reconnection** - Saves resources when server offline

**The bot will automatically slow down or pause if your device gets too hot or CPU usage is too high!**

---

## 📞 Need Help?

1. **Check logs** - Look for red [ERROR] messages
2. **Read OPTIMIZATION.md** - Performance tuning guide
3. **Check CONFIG-PRESETS.json** - Pre-configured settings
4. **Dashboard metrics** - Real-time performance data

---

## 🎯 Common Use Cases

### Just Want to Stay Online (AFK)
```json
{
  "mode": { "current": "afk" },
  "afk": {
    "movementInterval": 30000,
    "actions": ["jump", "sneak", "look"]
  }
}
```

### 24/7 Resource Gathering
```json
{
  "mode": { "current": "player" },
  "player": {
    "autoMine": true,
    "autoCollect": true
  }
}
```

### Minimal Battery Usage (Termux)
```json
{
  "safety": {
    "maxCpuPercent": 25,
    "maxMemoryMB": 200,
    "enableBatteryMonitoring": true
  },
  "mode": { "current": "afk" }
}
```

---

**You're all set! Happy botting!** 🎮🤖

*For detailed documentation, see README.md*
*For performance tuning, see OPTIMIZATION.md*
*For testing procedures, see TESTING.md*
