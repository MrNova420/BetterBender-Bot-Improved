# BetterBender 2.0 - Feature Audit & Architecture Plan

**Project**: Full rewrite of BetterSMP Bot → BetterBender 2.0  
**Date**: 2025-10-16  
**Goal**: Production-ready autonomous Minecraft bot for 24/7 Termux operation

---

## Original Project Features (Reference Only)

### Current Capabilities
- ✅ Basic Mode: Anti-AFK, chat responses, auto-welcome
- ✅ Advanced Mode: Mining, building, farming, exploration, combat
- ✅ Web Dashboard: Mode switching, monitoring, command controls
- ✅ Multi-account support: Offline, Microsoft, Mojang
- ✅ PM2 integration for process management
- ✅ Auto-reconnect and error recovery

### Current Limitations
- ❌ Not optimized for low-end devices
- ❌ No device health/thermal monitoring
- ❌ No adaptive throttling for battery/CPU
- ❌ Monolithic architecture (hard to extend)
- ❌ No modular addon system
- ❌ Limited task persistence
- ❌ No proper safety mechanisms for long-term running
- ❌ Bot behavior not realistic enough (doesn't mimic real players)
- ❌ Limited social interaction and community building features

---

## BetterBender 2.0 Architecture

### Core Philosophy
1. **Modular**: Clean addon/plugin architecture
2. **Safe**: Device health monitoring and adaptive throttling
3. **Realistic**: Advanced player simulation with human-like behaviors
4. **Lightweight**: Optimized for Termux on low-end Android devices
5. **Autonomous**: Can run for months with minimal intervention
6. **Intelligent**: Context-aware decision making without AI/ML

---

## New Architecture Components

### 1. Core Engine (`src/engine.js`)
**Purpose**: Bot lifecycle management and addon orchestration

**Features**:
- Clean API: `start()`, `stop()`, `registerAddon()`
- Mineflayer wrapper with robust reconnect logic
- Event system for addon communication
- Graceful shutdown and error handling
- Authentication: offline (default), Microsoft, Mojang

**Replacement**: Replaces `bot-enhanced.js` with cleaner architecture

---

### 2. Safety System (`src/core/safety.js`)
**Purpose**: Protect device from overheating and resource exhaustion

**Features**:
- CPU/memory monitoring via Node.js `os` module
- Battery status via `termux-battery-status` (Android)
- Thermal monitoring via `/sys/class/thermal` (if available)
- Configurable thresholds: maxCpuPercent (30%), maxMemoryMB (512)
- Adaptive actions: throttle tasks, pause addons, switch to AFK mode
- Log rotation and batched disk writes

**New Feature**: No equivalent in original project

---

### 3. Addon System (`addons/`)

#### AFK Mode (`addons/afk.js`)
**Purpose**: Ultra-lightweight server presence

**Features**:
- Minimal movement patterns (realistic idle behavior)
- Anti-AFK detection avoidance
- Mob awareness and avoidance
- Auto-eat when hungry
- Auto-respawn on death
- Periodic status updates

**Replacement**: Simplified version of original Basic Mode

---

#### Player Mode (`addons/player.js`)
**Purpose**: Full autonomous player simulation

**Features**:
- **State Machine**: work → rest → trade → social → explore (cyclical)
- **Inventory Management**: Smart item organization, chest storage
- **Work Activities**: Mining, farming, building, crafting
- **Social Activities**: Chat with players, help newcomers, trade
- **Community Building**: Construct public buildings, maintain farms
- **Exploration**: Discover new areas, map territory
- **Low-Impact Heuristics**: Limit blocks/hour to avoid suspicion
- **Realistic Timing**: Sleep schedules, breaks, varied activities

**Replacement**: Enhanced version of original Advanced Mode with realistic behaviors

---

#### Crafting System (`addons/crafting.js`)
**Features**:
- Recipe database
- Smart crafting based on inventory
- Auto-craft tools/food/building materials
- Prioritize needed items

---

#### Pathfinding System (`addons/pathfinding.js`)
**Features**:
- Use mineflayer-pathfinder
- Safe navigation avoiding hazards
- Efficient route planning
- Goal-based movement

---

#### Mining System (`addons/mining.js`)
**Features**:
- Intelligent ore detection
- Branch mining patterns
- Safe descent/ascent
- Torch placement
- Avoid lava/water

---

#### Building System (`addons/building.js`)
**Features**:
- Blueprint-based construction
- Resource gathering for projects
- Community structures (houses, farms, towers)
- Repair and maintenance

---

#### Trading System (`addons/trading.js`)
**Features**:
- Villager trading
- Player-to-player trades
- Value assessment
- Fair trade logic

---

### 4. Task Manager (`src/core/taskManager.js`)
**Purpose**: Queue and persistence for long-running tasks

**Features**:
- Priority-based task queue
- Persist to JSON (avoid native dependencies)
- Resume after reconnect/restart
- Task status tracking
- Cancellation support

**Replacement**: Enhanced version of `task-manager.js`

---

### 5. Dashboard (`dashboard/`)

#### Server (`dashboard/server.js`)
**Features**:
- Express + Socket.IO
- Admin token authentication
- Real-time bot control
- Live log streaming
- System health monitoring
- Task upload interface
- Remote command execution

#### UI (`dashboard/public/`)
**Features**:
- Vanilla JS SPA (lightweight, no build step)
- Start/Stop bot controls
- Mode toggle (AFK ↔ Player)
- Live chat interface
- Task management
- Health metrics dashboard
- Log viewer with filtering
- Command execution panel

**Replacement**: Modernized version of current dashboard

---

## Feature Mapping: Old → New

| Original Feature | BetterBender 2.0 Implementation |
|-----------------|--------------------------------|
| Basic Mode | `addons/afk.js` (optimized) |
| Advanced Mode | `addons/player.js` (enhanced realism) |
| Mining | `addons/mining.js` (smarter, safer) |
| Building | `addons/building.js` (blueprint-based) |
| Farming | Part of `addons/player.js` work state |
| Combat | Part of `addons/player.js` defense |
| Exploration | Part of `addons/player.js` explore state |
| Chat Responses | Enhanced in `addons/player.js` social state |
| Dashboard | `dashboard/` (cleaner, more features) |
| Auto-Reconnect | Built into `src/engine.js` |
| PM2 Support | `termux-install.sh` + fallback to nohup |
| Multi-Auth | `src/engine.js` auth system |

---

## New Features Not in Original

1. **Device Safety Monitoring**: CPU, memory, thermal, battery
2. **Adaptive Throttling**: Reduce activity when resources constrained
3. **Realistic Player Simulation**: State machine with human-like behaviors
4. **Community Building**: Bot helps other players, builds public structures
5. **Trading System**: Villagers and players
6. **Task Persistence**: Resume work after restart
7. **Modular Addons**: Easy to extend and customize
8. **Smart Inventory**: Organized storage, chest management
9. **Work/Rest Cycles**: Mimic real player schedules
10. **Social Interaction**: Context-aware chat, help players

---

## Technical Decisions

### Dependencies
- **mineflayer**: Core Minecraft bot library
- **mineflayer-pathfinder**: Navigation
- **express**: Web dashboard
- **socket.io**: Real-time communication
- **pm2**: Process management (optional, nohup fallback)
- **NO TypeScript**: Plain JavaScript for Termux compatibility
- **NO native modules**: Avoid compilation issues on Android

### File Structure
```
BetterBender-2.0/
├── src/
│   ├── engine.js              # Core bot engine
│   ├── core/
│   │   ├── safety.js          # Device health monitoring
│   │   ├── taskManager.js     # Task queue & persistence
│   │   └── logger.js          # Log rotation & batching
│   └── utils/
│       ├── reconnect.js       # Reconnect logic
│       └── auth.js            # Authentication helpers
├── addons/
│   ├── afk.js                 # AFK mode
│   ├── player.js              # Player mode
│   ├── crafting.js            # Crafting system
│   ├── pathfinding.js         # Navigation
│   ├── mining.js              # Mining operations
│   ├── building.js            # Construction
│   └── trading.js             # Trading logic
├── dashboard/
│   ├── server.js              # Dashboard backend
│   └── public/
│       ├── index.html         # UI
│       ├── app.js             # Frontend logic
│       └── styles.css         # Styling
├── test/
│   └── smoke.js               # Automated tests
├── termux/
│   └── termux-install.sh      # One-shot installer
├── test-results/              # Test logs
├── CONFIG.example.json        # Configuration template
├── package.json               # Dependencies & scripts
├── README.md                  # Documentation
└── AUDIT.md                   # This file
```

---

## Implementation Strategy

1. ✅ Create project structure
2. ✅ Build core engine with clean API
3. ✅ Implement safety system
4. ✅ Create AFK addon (simple, tested first)
5. ✅ Create Player addon (complex, realistic)
6. ✅ Build supporting addons (crafting, pathfinding, etc.)
7. ✅ Implement task manager with persistence
8. ✅ Build dashboard backend + frontend
9. ✅ Create Termux installer script
10. ✅ Write comprehensive tests
11. ✅ Test everything in mock environment
12. ✅ Fix all failures until passing
13. ✅ Document thoroughly
14. ✅ Create export package

---

## Success Criteria

- ✅ Both modes work reliably in tests
- ✅ Dashboard controls bot in real-time
- ✅ Safety system prevents device damage
- ✅ Tasks persist across restarts
- ✅ Termux installer works on first try
- ✅ All tests pass
- ✅ No TODOs or placeholders
- ✅ Bot behaves like a real player
- ✅ Can run for months with minimal intervention
- ✅ Complete documentation
- ✅ Export ready for download

---

**Status**: Architecture planned, ready for implementation 🚀
