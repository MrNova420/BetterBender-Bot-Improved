# 🤖 BetterBender 2.0

**The Ultimate Autonomous Minecraft Bot for 24/7 Long-Term Operation**

Fully autonomous, ultra-realistic Minecraft bot designed to run for months on Termux (Android) without intervention. Features advanced player simulation, device safety monitoring, and remote web dashboard control.

---

## 🚀 ONE-LINE TERMUX INSTALLATION

```bash
bash <(curl -s https://raw.githubusercontent.com/yourusername/betterbender-2.0/main/termux/termux-install.sh)
```

Or download and run manually:

```bash
git clone https://github.com/yourusername/betterbender-2.0.git
cd betterbender-2.0
bash termux/termux-install.sh
```

---

## ✨ Features

### 🎭 TWO POWERFUL MODES

#### **AFK Mode** - Ultra-Lightweight Server Presence
- Minimal movement patterns (anti-AFK detection avoidance)
- Automatic mob avoidance and escape
- Auto-eat when hungry
- Auto-respawn on death
- Uses <5% CPU on average

#### **Player Mode** - FULLY AUTONOMOUS PLAYER SIMULATION
**The bot behaves EXACTLY like a real player:**

✅ **Natural Chat & Social**
- Greets players when they join
- Responds to questions contextually
- Random observations about the world
- Helps new players
- Natural typing delays (1-3 seconds)
- Realistic conversation flow

✅ **Realistic Work Activities**
- Mining with proper tool selection
- Gathering resources (wood, crops, items)
- Building structures block by block
- Organizing inventory naturally
- Variable work speeds (not robotic)

✅ **Human-like Movement**
- Random walks and exploration
- Stops to look around
- Occasional jumps while walking
- Sprint bursts
- Natural path selection

✅ **State Machine Lifecycle**
- **Work** (30%) - Mining, gathering, building
- **Rest** (15%) - Standing, looking around, organizing
- **Explore** (20%) - Walking, discovering areas
- **Social** (15%) - Chatting, helping players
- **Build** (15%) - Constructing structures
- **Organize** (5%) - Inventory management

✅ **Anti-Detection Features**
- Block rate limiting (max 200/hour by default)
- Natural delays between actions
- Random activity patterns
- Realistic mistakes and reactions
- Variable response times

### 🛡️ DEVICE SAFETY (Critical for 24/7 Operation)

**Prevents Device Damage:**
- 📊 CPU usage monitoring (auto-throttle at 30%)
- 💾 Memory monitoring (auto-throttle at 512MB)
- 🌡️ Temperature monitoring (Termux thermal sensors)
- 🔋 Battery monitoring (auto-throttle when <20%)
- ⚡ Adaptive throttling (switches to AFK when overloaded)
- 📝 Log rotation (prevents disk fill)

**Perfect for Months-Long Operation:**
- Automatic resource management
- No memory leaks
- Graceful degradation under load
- Safe shutdown procedures

### 🎛️ WEB DASHBOARD (Remote Control)

**Access:** `http://localhost:5000` or `http://YOUR_IP:5000`

**Features:**
- 🔄 Start/Stop bot remotely
- 🎮 Switch modes instantly
- 💬 Live chat interface
- 📊 Real-time metrics (CPU, RAM, temp, battery)
- 📈 Bot status (health, food, position, mode)
- ⚡ Execute commands
- 📋 Task queue management
- 📜 Live log streaming
- 🔐 Token authentication

---

## 📱 TERMUX SETUP (Android)

### Step 1: Install Termux

Download from **F-Droid** (NOT Google Play - outdated version):
https://f-droid.org/en/packages/com.termux/

### Step 2: Run Installer

```bash
pkg update && pkg install git -y
git clone https://github.com/yourusername/betterbender-2.0.git
cd betterbender-2.0
bash termux/termux-install.sh
```

The installer will:
- ✅ Install Node.js
- ✅ Install dependencies
- ✅ Create CONFIG.json
- ✅ Set up PM2 (optional)
- ✅ Configure safety defaults
- ✅ Set up directories

### Step 3: Configure

Edit `CONFIG.json`:

```bash
nano CONFIG.json
```

**Minimum settings:**

```json
{
  "server": {
    "host": "your.server.ip",
    "port": 25565,
    "version": "1.20.1"
  },
  "auth": {
    "type": "offline",
    "username": "BetterBender"
  },
  "dashboard": {
    "adminToken": "CHANGE_THIS_NOW"
  }
}
```

### Step 4: Start

**With PM2 (Recommended for 24/7):**

```bash
npm run pm2:start
pm2 save
pm2 startup
```

**Direct:**

```bash
npm run dashboard
```

### Step 5: Keep Running 24/7

**Install wake lock:**

```bash
termux-wake-lock
```

**Auto-start on boot:**

1. Install Termux:Boot from F-Droid
2. Create `~/.termux/boot/start-bot.sh`:

```bash
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
cd ~/betterbender-2.0
pm2 resurrect
```

3. Make executable: `chmod +x ~/.termux/boot/start-bot.sh`

**Prevent battery optimization:**

Settings → Apps → Termux → Battery → Don't optimize

---

## ⚙️ CONFIGURATION

### Safety Settings (CRITICAL)

```json
{
  "safety": {
    "maxCpuPercent": 30,
    "maxMemoryMB": 512,
    "maxBlocksPerHour": 200,
    "checkIntervalMs": 30000,
    "enableThermalMonitoring": true,
    "enableBatteryMonitoring": true,
    "autoThrottle": true
  }
}
```

**For low-end devices:**
- `maxCpuPercent: 20`
- `maxMemoryMB: 256`
- Use AFK mode primarily

**For high-end devices:**
- `maxCpuPercent: 50`
- `maxMemoryMB: 1024`
- `maxBlocksPerHour: 400`

### Mode Settings

**AFK Mode:**

```json
{
  "afkMode": {
    "movementPattern": "random",
    "movementInterval": 15000,
    "movementRange": 5,
    "autoEat": true,
    "autoRespawn": true,
    "avoidMobs": true,
    "statusUpdateInterval": 60000
  }
}
```

**Player Mode:**

```json
{
  "playerMode": {
    "workDuration": 1800000,
    "restDuration": 300000,
    "tradeDuration": 600000,
    "socialDuration": 900000,
    "exploreDuration": 1200000,
    "buildDuration": 1500000,
    "maxBlocksPerCycle": 100,
    "smartInventory": true,
    "useChests": true,
    "helpPlayers": true,
    "buildCommunity": true,
    "respondToChat": true
  }
}
```

### Authentication

**Offline/Cracked:**

```json
{
  "auth": {
    "type": "offline",
    "username": "BotName"
  }
}
```

**Microsoft Account:**

```json
{
  "auth": {
    "type": "microsoft",
    "username": "email@outlook.com"
  }
}
```

Device code will appear in logs - enter it at microsoft.com/link

**Mojang (Legacy):**

```json
{
  "auth": {
    "type": "mojang",
    "username": "your_username",
    "password": "your_password"
  }
}
```

---

## 🎮 USAGE

### NPM Scripts

```bash
npm start              # Start bot
npm run dashboard      # Start dashboard + bot
npm test               # Run tests

# PM2
npm run pm2:start      # Start with PM2
npm run pm2:stop       # Stop
npm run pm2:restart    # Restart
npm run pm2:logs       # View logs
npm run pm2:status     # Status
```

### PM2 Commands

```bash
pm2 list               # List processes
pm2 logs               # Live logs
pm2 monit              # Monitor resources
pm2 restart all        # Restart
pm2 stop all           # Stop
pm2 delete all         # Remove
pm2 save               # Save state
pm2 resurrect          # Restore saved state
```

### Dashboard Access

**Local (Termux):**
```
http://localhost:5000
```

**Remote (from PC/phone on same WiFi):**
```
http://TERMUX_DEVICE_IP:5000
```

Find your IP: `ifconfig` or `ip addr`

---

## 🔐 SECURITY

### Change Admin Token

**CRITICAL**: Change the default token immediately!

Edit `CONFIG.json`:

```json
{
  "dashboard": {
    "adminToken": "your_very_secure_random_token_here"
  }
}
```

Generate secure token:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Network Security

**Local only (recommended):**

Dashboard binds to `0.0.0.0:5000` by default. For local-only access, firewall port 5000.

**SSH Tunnel (safest for remote access):**

```bash
# On your computer
ssh -L 5000:localhost:5000 termux@device-ip

# Access: http://localhost:5000
```

---

## 🐛 TROUBLESHOOTING

### Bot Won't Start

1. **Check logs:** `pm2 logs` or `data/logs/`
2. **Verify config:** `cat CONFIG.json | grep -E "(host|port|version)"`
3. **Test connection:** `ping your.server.ip`
4. **Check version:** Server version must match `server.version`

### Dashboard Not Loading

1. **Port in use:** `lsof -i :5000` (if installed)
2. **Change port:** Edit `dashboard.port` in CONFIG.json
3. **Check token:** Verify admin token is set
4. **Browser cache:** Clear cache or try incognito

### High Resource Usage

1. **Switch to AFK mode** from dashboard
2. **Lower safety thresholds**
3. **Increase action delays**
4. **Reduce maxBlocksPerHour**

### Bot Keeps Disconnecting

1. **Check reconnect settings**
2. **Server kicks:** Check server logs
3. **Network:** Ensure stable WiFi
4. **Whitelist:** Add bot to server whitelist

### Termux Stops When Screen Off

1. **Install Termux:Wake Lock**
2. **Run:** `termux-wake-lock`
3. **Disable battery optimization**
4. **Use PM2** for process management

### Memory Issues

1. **Set lower maxMemoryMB**
2. **Use AFK mode**
3. **Restart bot daily:** `crontab -e` → `0 4 * * * pm2 restart all`

---

## 📊 PERFORMANCE

### Resource Usage

**AFK Mode:**
- CPU: 2-5%
- RAM: 150-200 MB
- Battery: Minimal impact

**Player Mode:**
- CPU: 10-30%
- RAM: 300-500 MB
- Battery: Moderate impact

### Optimization Tips

**For 24/7 operation:**
- Keep device plugged in
- Ensure good ventilation
- Use AFK mode overnight
- Monitor temperature regularly
- Set up automatic restarts

**Network:**
- Use WiFi (not mobile data)
- Stable connection required
- 5-10 Mbps recommended

---

## 🏗️ PROJECT STRUCTURE

```
BetterBender-2.0/
├── src/
│   ├── engine.js           # Core bot engine
│   ├── core/
│   │   ├── logger.js       # Logging system
│   │   ├── safety.js       # Device safety
│   │   └── taskManager.js  # Task queue
│   └── utils/
│       ├── auth.js         # Authentication
│       └── reconnect.js    # Reconnect logic
├── addons/
│   ├── afk.js             # AFK mode
│   ├── player.js          # Player mode (enhanced)
│   ├── crafting.js        # Crafting system
│   ├── pathfinding.js     # Navigation
│   ├── mining.js          # Mining
│   ├── building.js        # Building
│   └── trading.js         # Trading
├── dashboard/
│   ├── server.js          # Backend
│   └── public/
│       └── index.html     # Dashboard UI
├── termux/
│   └── termux-install.sh  # Installer
├── test/
│   └── smoke.js           # Tests
├── data/                  # Runtime data
│   ├── logs/              # Log files
│   └── tasks/             # Task persistence
├── CONFIG.json            # Your config
├── CONFIG.example.json    # Example config
├── package.json           # Dependencies
└── README.md              # This file
```

---

## ⚠️ IMPORTANT NOTES

### Long-Term Operation

**For months-long operation:**
- ✅ Use PM2 with auto-restart
- ✅ Set up PM2 startup script
- ✅ Enable wake lock
- ✅ Monitor device temperature
- ✅ Keep device cool and ventilated
- ✅ Stable power supply
- ✅ Stable internet connection

### Server Etiquette

- ✅ Get permission before running bots
- ✅ Respect server rules
- ✅ Don't grief or spam
- ✅ Build helpful structures
- ✅ Help other players
- ✅ Use realistic block rates

### Device Safety

- 🌡️ Temperature should stay below 60°C
- 🔋 Use while plugged in for 24/7
- 💨 Ensure good airflow
- 📱 Monitor device health
- ⚠️ Stop if device gets hot

---

## 📖 EXAMPLES

### Example 1: AFK on Server

Keep server populated while you're away.

**CONFIG.json:**
```json
{
  "mode": { "current": "afk" },
  "afkMode": {
    "movementInterval": 20000,
    "movementRange": 3
  }
}
```

Start: `npm run pm2:start`

### Example 2: Autonomous Player

Bot lives on server, gathering resources and building.

**CONFIG.json:**
```json
{
  "mode": { "current": "player" },
  "playerMode": {
    "respondToChat": true,
    "helpPlayers": true,
    "maxBlocksPerCycle": 150
  }
}
```

Start: `npm run pm2:start`

### Example 3: Low-Power Mode

For old/slow devices.

**CONFIG.json:**
```json
{
  "safety": {
    "maxCpuPercent": 15,
    "maxMemoryMB": 200
  },
  "mode": { "current": "afk" }
}
```

---

## 🆘 SUPPORT

### Logs

- **Bot logs:** `data/logs/bot-YYYY-MM-DD.log`
- **PM2 logs:** `pm2 logs`
- **Test results:** `test-results/`

### Debug Mode

Enable detailed logging:

```json
{
  "logging": {
    "level": "debug"
  }
}
```

---

## ✅ CHECKLIST

Before running 24/7:

- [ ] CONFIG.json configured
- [ ] Admin token changed
- [ ] PM2 installed and running
- [ ] Wake lock enabled
- [ ] Battery optimization disabled
- [ ] Device properly cooled
- [ ] Stable power supply
- [ ] Stable WiFi connection
- [ ] Server permission obtained
- [ ] Tested for 1 hour first

---

## 📜 LICENSE

MIT License - See LICENSE file

---

## ⚠️ DISCLAIMER

- Use responsibly and ethically
- Get server admin permission
- Respect server rules and players
- Monitor your device health
- Use at your own risk
- Not responsible for bans or damage

---

**Built for the Minecraft community with ❤️**

*Fully autonomous • Ultra-realistic • Production-ready*

🎮 Enjoy your 24/7 Minecraft companion! 🤖
