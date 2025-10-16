# 🎮 BetterBender 2.0 - Super Easy Setup

## ⚡ Quick Start (3 Steps!)

### Step 1: Install Node.js
- **Windows/Mac**: Download from [nodejs.org](https://nodejs.org)
- **Linux/Termux**: `pkg install nodejs-lts` or `apt install nodejs`

### Step 2: Configure Server
Edit `CONFIG.json` - change just ONE line:
```json
{
  "server": {
    "host": "YOUR-SERVER-HERE",    ← Put your Minecraft server here!
    "port": 25565
  }
}
```

Examples:
- `"host": "play.hypixel.net"` 
- `"host": "192.168.1.100"`
- `"host": "myserver.aternos.me"`

### Step 3: Start Bot
**Windows**: Double-click `start.bat`
**Mac/Linux**: `./start.sh`
**Or manually**: `node dashboard/server.js CONFIG.json`

**That's it!** 🎉

---

## 📊 Dashboard

Open browser: **http://localhost:5000**
- ✅ No login needed for localhost!
- 🎮 Full control panel
- 📈 Real-time stats
- 🔄 Switch AFK ↔ Player mode

---

## 🤖 Bot Modes

### AFK Mode (Default - Simple)
- Prevents AFK kicks
- Minimal resources
- Just stays online

### Player Mode (Autonomous!)
**The bot becomes a real player:**
- ✅ Builds its own home
- ✅ Gathers resources automatically  
- ✅ Crafts tools and items
- ✅ Mines and explores
- ✅ Trades with villagers
- ✅ Interacts with other players
- ✅ Creates community and helps others
- ✅ Generates new goals dynamically
- ✅ Never stops progressing!

**Switch to Player Mode:**
1. Open dashboard (http://localhost:5000)
2. Click "Switch to Player"
3. Bot starts building and progressing!

---

## 🏠 What Player Mode Does

### Phase 1: Survival (First 10 minutes)
1. Gathers wood and basic resources
2. Crafts tools (pickaxe, axe, shovel)
3. Finds food
4. **Finds best location for home**

### Phase 2: Home Building (10-30 minutes)
1. **Builds complete home with:**
   - Foundation and walls
   - Roof and door
   - Storage chests
   - Workspace area

### Phase 3: Expansion (30+ minutes)
1. Builds farm for food
2. Expands storage system
3. Mines for resources
4. Explores nearby areas

### Phase 4: Community (1+ hours)
1. Trades with villagers
2. Helps other players
3. Builds community structures
4. Generates new projects automatically!

**The bot NEVER stops!** It always creates new goals based on what it has and what it needs.

---

## 📱 Device Settings

### Old Phone/Tablet
```json
{
  "mode": { "current": "afk" },
  "safety": {
    "maxCpuPercent": 30,
    "maxMemoryMB": 256
  }
}
```

### Modern Phone
```json
{
  "mode": { "current": "player" },
  "safety": {
    "maxCpuPercent": 45,
    "maxMemoryMB": 512
  }
}
```

### PC/Laptop
```json
{
  "mode": { "current": "player" },
  "safety": {
    "maxCpuPercent": 60,
    "maxMemoryMB": 1024
  }
}
```

Just copy these to your `CONFIG.json`!

---

## 🔧 Account Types

### Offline/Cracked Server (Easiest)
```json
{
  "auth": {
    "type": "offline",
    "username": "MyBot"
  }
}
```

### Microsoft Account (Premium)
```json
{
  "auth": {
    "type": "microsoft",
    "username": "your-email@example.com"
  }
}
```
Bot will show you a link - click it and login!

### Mojang Account (Legacy)
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

## 🚀 24/7 Running

### Windows
1. Double-click `start.bat`
2. Minimize window (don't close!)
3. Bot runs forever

### Linux/Mac/Termux
```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start ecosystem.config.js

# Bot now runs 24/7!
# Check status:
pm2 status

# View logs:
pm2 logs
```

### Termux (Android) 24/7
```bash
# Start bot
node dashboard/server.js CONFIG.json

# Press Ctrl+Z, then:
bg
disown

# Bot runs in background!
# Keep Termux app in memory:
# Settings → Battery → No restrictions
```

---

## 📂 Files You Need

```
BetterBender/
├── CONFIG.json          ← Edit this one!
├── start.sh            ← Linux/Mac start
├── start.bat           ← Windows start
├── dashboard/          ← Dashboard files
├── src/                ← Bot brain
└── addons/             ← Bot abilities
```

**Only edit**: `CONFIG.json`
**Everything else**: Leave as is!

---

## ❓ Troubleshooting

### "Connection Refused"
✅ Server is offline - bot will auto-retry
✅ Change server address in CONFIG.json

### "Module not found"
```bash
npm install
```

### High CPU
1. Lower CPU limit in CONFIG.json:
   ```json
   "maxCpuPercent": 30
   ```
2. Or use AFK mode instead of Player mode

### Bot doesn't build home
1. Make sure mode is "player"
2. Give it 10-15 minutes to gather resources first
3. Check dashboard for current activity

### Can't access dashboard
- Try: http://127.0.0.1:5000
- Or: http://[your-ip]:5000

---

## 🎯 What Makes This Special?

### Traditional Minecraft Bots:
- ❌ Need complex setup
- ❌ Do only what you program
- ❌ Stop when goals complete
- ❌ Can't adapt to situations

### BetterBender 2.0:
- ✅ **3-step setup** (install, configure, run)
- ✅ **Autonomous goal generation** - creates own objectives
- ✅ **Never stops** - always finds something to do
- ✅ **Builds communities** - interacts like real player
- ✅ **Home & base building** - establishes presence
- ✅ **Resource management** - gathers, stores, trades
- ✅ **Adaptive behavior** - reacts to environment
- ✅ **24/7 stable** - optimized for long-term running

---

## 🎮 Example: First Hour of Player Mode

```
00:00 - Bot joins server
00:01 - "Hey everyone!" (greets players)
00:02 - Starts gathering wood
00:05 - Crafts wooden pickaxe
00:08 - Mines stone
00:10 - Crafts stone tools
00:15 - Finds ideal home location near trees and water
00:20 - Builds foundation of home (9x9)
00:25 - Builds walls and roof
00:30 - Adds door and windows
00:35 - Places storage chests
00:40 - Builds small farm
00:45 - Starts mining for iron
00:50 - Trades with nearby player
00:55 - Expands base with workshop
01:00 - Creates new goal: "Find diamonds"
```

**And it continues forever!**

---

## 📖 More Documentation

- **SETUP-GUIDE.md** - Detailed setup instructions
- **OPTIMIZATION.md** - Performance tuning
- **CONFIG-PRESETS.json** - Ready-to-use configs
- **PRODUCTION-READY.md** - Deployment guide

---

## ✅ You're Ready!

1. ✅ Install Node.js
2. ✅ Edit CONFIG.json (server address)
3. ✅ Run: `./start.sh` or `start.bat`
4. ✅ Open: http://localhost:5000
5. ✅ Switch to Player mode
6. ✅ Watch your bot build and progress!

**The bot will do everything else automatically!** 🚀

---

**Questions? Check SETUP-GUIDE.md for detailed help!**
