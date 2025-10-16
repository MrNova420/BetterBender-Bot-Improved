# 🤖 BetterBender 2.0 - Autonomous Minecraft Bot

**A fully autonomous Minecraft bot that acts like a real player - builds homes, gathers resources, trades, creates communities, and generates its own goals for months of continuous operation!**

---

## ⚡ Quick Start (3 Steps!)

### 1. Install Node.js
```bash
# Download from https://nodejs.org
# Or on Termux: pkg install nodejs-lts
```

### 2. Configure Server
Edit `CONFIG.json` - change ONE line:
```json
{
  "server": {
    "host": "YOUR-SERVER-HERE"    ← Put your Minecraft server here!
  }
}
```

### 3. Start Bot
```bash
./start.sh           # Linux/Mac
start.bat            # Windows
# Or: node dashboard/server.js CONFIG.json
```

**Dashboard**: http://localhost:5000 (no login needed!)

---

## 🎮 What It Does

### AFK Mode (Simple)
- Prevents AFK kicks
- Minimal resource usage  
- Just stays online

### Player Mode (Autonomous!) ⭐
**The bot becomes a real player:**

✅ **Survival** - Gathers food, wood, crafts tools
✅ **Home Building** - Finds location, builds complete home  
✅ **Resource Gathering** - Mines, collects, organizes inventory
✅ **Exploration** - Discovers new areas and biomes
✅ **Trading** - Finds villagers and trades automatically
✅ **Community** - Interacts with players, helps others
✅ **Dynamic Goals** - Creates new objectives automatically
✅ **Never Stops** - Always has something to do!

---

## 🏠 Autonomous Features

### How Player Mode Works:

**Phase 1: Survival (0-10 min)**
- Gathers wood and resources
- Crafts basic tools
- Finds food
- Establishes home location

**Phase 2: Building (10-30 min)**
- Builds foundation
- Constructs walls and roof
- Adds storage chests
- Creates workspace

**Phase 3: Expansion (30+ min)**
- Builds farms
- Mines for resources
- Explores nearby areas
- Expands storage

**Phase 4: Community (1+ hours)**
- Trades with villagers
- Helps other players
- Builds community structures
- **Generates new goals automatically!**

### Dynamic Goal Generation

The bot **never runs out of things to do**. It constantly evaluates:
- Current inventory and resources
- Health and food levels
- Nearby players and villages
- Completed milestones
- Environmental opportunities

Then automatically creates goals like:
- "Need tools? Craft them!"
- "Low on food? Find some!"
- "Players nearby? Interact!"
- "Have excess resources? Trade!"
- "Home established? Expand it!"

---

## 📊 Dashboard

Open: **http://localhost:5000**

Features:
- 📈 Real-time bot status
- ❤️ Health & food monitoring
- 📍 Position tracking
- 🎯 Current goals & tasks
- 💬 Chat & commands
- ⚙️ Settings & controls
- 🔄 Switch AFK ↔ Player mode

---

## 🚀 24/7 Deployment

### PM2 (Recommended for Linux/Mac)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Termux (Android)
```bash
node dashboard/server.js CONFIG.json
# Press Ctrl+Z, then:
bg
disown
# Settings → Battery → No restrictions
```

### Windows
Double-click `start.bat` and minimize window

---

## ⚙️ Configuration

### Device Presets

**Old Phone/Tablet:**
```json
{
  "mode": { "current": "afk" },
  "safety": {
    "maxCpuPercent": 30,
    "maxMemoryMB": 256
  }
}
```

**Modern Phone:**
```json
{
  "mode": { "current": "player" },
  "safety": {
    "maxCpuPercent": 45,
    "maxMemoryMB": 512
  }
}
```

**PC/Laptop:**
```json
{
  "mode": { "current": "player" },
  "safety": {
    "maxCpuPercent": 60,
    "maxMemoryMB": 1024
  }
}
```

### Account Types

**Offline/Cracked (Easiest):**
```json
{
  "auth": {
    "type": "offline",
    "username": "MyBot"
  }
}
```

**Microsoft (Premium):**
```json
{
  "auth": {
    "type": "microsoft",
    "username": "your-email@example.com"
  }
}
```

**Mojang (Legacy):**
```json
{
  "auth": {
    "type": "mojang",
    "username": "your-username",
    "password": "your-password"
  }
}
```

---

## 🎯 Features

### Core Features
- ✅ Autonomous goal generation
- ✅ Home & base building
- ✅ Resource management
- ✅ Pathfinding & navigation
- ✅ Combat & auto-defend
- ✅ Trading with villagers
- ✅ Community interaction
- ✅ Chat responses
- ✅ Inventory management
- ✅ 24/7 stability

### Safety Features
- ✅ CPU monitoring & throttling
- ✅ Memory limits
- ✅ Thermal protection (Termux)
- ✅ Battery awareness
- ✅ Smart reconnection
- ✅ Auto-respawn
- ✅ Health alerts

---

## 📁 Project Structure

```
BetterBender/
├── CONFIG.json              # Your settings
├── start.sh / start.bat     # Easy start scripts
├── dashboard/               # Web control panel
├── src/
│   ├── core/               # Bot brain
│   │   ├── autonomousGoals.js    # Dynamic goal generation
│   │   ├── homeBuilder.js        # Home building system
│   │   ├── progressionSystem.js  # Achievement tracking
│   │   └── safety.js            # Device protection
│   └── utils/              # Helper functions
└── addons/
    ├── player.js           # Full player simulation
    ├── afk.js             # AFK prevention
    ├── mining.js          # Mining automation
    ├── building.js        # Building automation
    ├── crafting.js        # Crafting system
    └── trading.js         # Trading automation
```

---

## 📚 Documentation

- **README-SIMPLE.md** - Beginner-friendly setup
- **SETUP-GUIDE.md** - Detailed configuration
- **OPTIMIZATION.md** - Performance tuning
- **CONFIG-PRESETS.json** - Ready-to-use configs
- **TESTING.md** - Testing procedures
- **PRODUCTION-READY.md** - Deployment guide
- **CHANGELOG.md** - Version history

---

## ⚠️ Troubleshooting

### Connection Refused
✅ Server is offline - bot will auto-retry

### High CPU
```json
{ "safety": { "maxCpuPercent": 30 } }
```

### Bot Not Building
- Make sure mode is "player"
- Give it 10-15 minutes to gather resources
- Check dashboard for current activity

### Can't Access Dashboard
Try:
- http://localhost:5000
- http://127.0.0.1:5000

---

## 🎮 Example: First Hour

```
00:00 - Bot joins server
00:01 - "Hey everyone!" (greets)
00:02 - Gathers wood
00:05 - Crafts pickaxe
00:08 - Mines stone
00:10 - Crafts stone tools
00:15 - Finds home location
00:20 - Builds foundation
00:25 - Builds walls
00:30 - Adds door
00:35 - Places chests
00:40 - Builds farm
00:45 - Mines for iron
00:50 - Trades with player
00:55 - Expands base
01:00 - Creates goal: "Find diamonds"
```

**And continues forever!**

---

## 🔥 What Makes This Special?

### Other Minecraft Bots:
- ❌ Complex setup
- ❌ Fixed behaviors only
- ❌ Stop when goals complete
- ❌ Can't adapt

### BetterBender 2.0:
- ✅ **3-step setup**
- ✅ **Autonomous goal generation**
- ✅ **Never stops progressing**
- ✅ **Builds communities**
- ✅ **Adapts to environment**
- ✅ **24/7 stable**
- ✅ **Easy to use & reuse**

---

## 📊 Performance

### Resource Usage (Connected to Server)

| Device     | CPU    | RAM      | Battery |
|-----------|--------|----------|---------|
| Low-End   | 5-15%  | 80-150MB | Minimal |
| Medium    | 10-25% | 150-300MB| Low     |
| High-End  | 15-40% | 300-600MB| Moderate|

**Note**: CPU spikes to 50-80% during reconnection when server is offline (normal behavior).

---

## ✅ Quick Checklist

- [ ] Install Node.js
- [ ] Edit CONFIG.json (server address)
- [ ] Run start script
- [ ] Open dashboard (localhost:5000)
- [ ] Switch to Player mode
- [ ] Watch bot build and progress!

---

## 🤝 Community & Support

**Made with ❤️ for the Minecraft community**

- Stable and tested
- Optimized for long-term operation  
- Safe for your device
- Easy to setup and reuse

**Need help?** Check the documentation files!

---

**Happy Botting!** 🎮🤖
