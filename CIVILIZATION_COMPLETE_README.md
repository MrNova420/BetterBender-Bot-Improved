# 🏛️ Minecraft Civilization System - Complete Guide

**Version:** 1.0.0  
**Last Updated:** October 19, 2025  
**Author:** BetterBender 2.0 Project

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [What is This?](#what-is-this)
3. [Key Features](#key-features)
4. [System Architecture](#system-architecture)
5. [Installation](#installation)
6. [Quick Start](#quick-start)
7. [Configuration](#configuration)
8. [Core Systems](#core-systems)
9. [Personality System](#personality-system)
10. [Trading & Economy](#trading--economy)
11. [Village Formation](#village-formation)
12. [Dashboard Guide](#dashboard-guide)
13. [Advanced Usage](#advanced-usage)
14. [Troubleshooting](#troubleshooting)
15. [FAQ](#faq)
16. [Contributing](#contributing)

---

## Overview

The **Minecraft Civilization System** transforms your Minecraft server into a living, breathing digital society. Multiple autonomous bots with unique personalities, emotions, and memories interact, form relationships, build villages, trade resources, and create evolving cultures - all without any actual AI or LLMs, using pure algorithmic intelligence.

### 🎯 What This Is

- **NOT**: AI/GPT/LLM-powered bots that "think"  
- **IS**: Sophisticated simulation system with personality-driven decision making  
- **NOT**: Simple AFK bots that stand still  
- **IS**: Fully autonomous agents that gather, build, socialize, and evolve  
- **NOT**: Scripted behavior that repeats  
- **IS**: Dynamic decision engine that adapts to context, emotions, and relationships

---

## Key Features

### 🤖 Autonomous Bots
- **Personality-driven behavior** - 8 traits define each bot's character
- **Dynamic emotions** - 7 emotional states drive decisions
- **Persistent memory** - Bots remember events, achievements, and interactions
- **Full action execution** - Mining, building, crafting, combat, trading, socializing
- **Pathfinding navigation** - Smart movement and resource gathering

### 🏘️ Village System
- **Automatic formation** - Bots with high trust naturally form villages
- **Territory claiming** - Villages have defined boundaries and shared resources
- **Role assignment** - Leader, builder, farmer, miner, guard, trader
- **Collective goals** - Villages vote on and pursue shared objectives
- **Resource pooling** - Shared storage and distribution systems

### 💰 Trading & Economy
- **Item valuation** - Dynamic pricing based on rarity and supply/demand
- **Trust-based pricing** - Friends get discounts, strangers pay premium
- **Negotiation system** - Propose, counter-offer, accept/reject trades
- **Trade history** - Tracks all exchanges for relationship building
- **Need-based trading** - Bots trade to fulfill actual needs

### 🧠 Intelligence Systems
- **Decision Engine** - Utility-based AI chooses optimal actions
- **Social System** - Friendship formation, trust calculation, relationship tracking
- **Memory System** - Event recording with categorization and retrieval
- **Emotion Engine** - Dynamic emotional states based on context
- **Context Awareness** - Environmental scanning and safety evaluation

### 🌐 Real-time Dashboard
- **Live monitoring** - Track all bots, villages, and events
- **WebSocket updates** - Real-time data streaming
- **Bot statistics** - Health, food, position, inventory, emotions
- **Village tracking** - Population, resources, goals, member list
- **Event log** - Civilization-wide event stream

### ⏰ Offline Simulation
- **Time extrapolation** - Simulates bot behavior when server offline
- **State persistence** - All data saved to SQLite database
- **Catch-up system** - Applies offline changes when back online
- **Memory generation** - Creates realistic memories during downtime

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CIVILIZATION SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Bot Manager  │  │  WebSocket   │  │   Database   │      │
│  │  (Spawning)  │  │   Broker     │  │   (SQLite)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│  ┌──────▼──────────────────▼──────────────────▼────────┐    │
│  │              Bot Intelligence Layer                   │    │
│  ├───────────────────────────────────────────────────────┤   │
│  │  • Decision Engine (Utility-based AI)                 │   │
│  │  • Action Executor (Mining, Building, Combat, etc.)   │   │
│  │  • Memory System (Event storage & retrieval)          │   │
│  │  • Social System (Relationships & trust)              │   │
│  │  • Emotion System (Dynamic states)                    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           Civilization Layer                           │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  • Village System (Formation, roles, goals)           │  │
│  │  • Trading System (Valuation, negotiation)            │  │
│  │  • Cultural System (Traditions, identity)             │  │
│  │  • Event System (Births, deaths, discoveries)         │  │
│  │  • Offline Simulation (Time extrapolation)            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           User Interface                               │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  • Web Dashboard (Port 3001)                          │  │
│  │  • Real-time WebSocket Updates                        │  │
│  │  • Bot/Village Monitoring                             │  │
│  │  • Event Log & Analytics                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

### Prerequisites

- **Node.js** 14+ (v22 recommended)
- **Minecraft Server** (Java Edition, any version)
- **2GB RAM** minimum (4GB recommended for 5+ bots)
- **SQLite** (included with better-sqlite3)

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `mineflayer` - Minecraft bot client
- `mineflayer-pathfinder` - Pathfinding navigation
- `better-sqlite3` - Database persistence
- `ws` - WebSocket communication
- `express` - Web server for dashboard
- `ejs` - Dashboard templating
- `socket.io` - Real-time updates

### Step 2: Configure Environment

Copy the example config:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Minecraft Server
MC_HOST=localhost
MC_PORT=25565
MC_VERSION=1.20.1

# Database
DB_PATH=./data/civilization/civilization.db

# WebSocket Broker
WS_PORT=8080

# Dashboard
DASHBOARD_PORT=3001

# Bot Configuration
BOT_COUNT=3
BOT_PREFIX=CivBot
```

### Step 3: Validate Personalities

Ensure all personality files are valid:

```bash
node civilization/scripts/validate_personalities.js
```

You should see:

```
✓ builder.json - VALID
✓ default.json - VALID
✓ explorer.json - VALID
✓ gatherer.json - VALID
✓ social.json - VALID

5 valid, 0 invalid
```

---

## Quick Start

### Option 1: Start Everything (Recommended)

```bash
npm run civ:all
```

This starts:
1. Civilization bot system
2. Real-time dashboard (http://localhost:3001)

### Option 2: Start Separately

Terminal 1 - Civilization System:
```bash
npm run civilization
```

Terminal 2 - Dashboard:
```bash
npm run civ:dashboard
```

### Option 3: Test Offline Simulation

```bash
npm run civ:test
```

Simulates 3 bots for 8 hours offline to verify system works.

---

## Configuration

### Bot Configuration

Edit `civilization/index.js` to customize bots:

```javascript
const config = {
  dbPath: './data/civilization/civilization.db',
  wsPort: 8080,
  bots: [
    {
      name: 'Alice',
      personalityType: 'builder',
      host: 'localhost',
      port: 25565
    },
    {
      name: 'Bob',
      personalityType: 'explorer',
      host: 'localhost',
      port: 25565
    },
    {
      name: 'Charlie',
      personalityType: 'social',
      host: 'localhost',
      port: 25565
    }
  ]
};
```

### Personality Types

5 built-in personalities:

1. **default** - Balanced traits
2. **builder** - High work_ethic, creativity
3. **explorer** - High curiosity, risk_tolerance
4. **social** - High sociability, empathy
5. **gatherer** - High work_ethic, low risk_tolerance

### Creating Custom Personalities

Create `civilization/personalities/custom.json`:

```json
{
  "name": "Warrior",
  "description": "Aggressive bot focused on combat and defense",
  "traits": {
    "curiosity": 0.4,
    "sociability": 0.3,
    "ambition": 0.9,
    "aggression": 0.9,
    "empathy": 0.2,
    "creativity": 0.4,
    "risk_tolerance": 0.8,
    "work_ethic": 0.7
  },
  "preferences": {
    "preferred_biomes": ["plains", "mountains"],
    "building_style": "fortress",
    "favorite_activities": ["combat", "defend", "patrol"],
    "social_frequency": "low"
  },
  "motivation_weights": {
    "survival": 1.5,
    "exploration": 0.6,
    "social": 0.3,
    "building": 0.8,
    "resource_gathering": 0.9,
    "trading": 0.4,
    "resting": 0.5
  }
}
```

Validate:

```bash
node civilization/scripts/validate_personalities.js
```

---

## Core Systems

### 1. Decision Engine

The brain of each bot. Uses **utility-based AI** to choose actions:

**How it works:**
1. Gathers context (health, food, nearby bots, resources)
2. Evaluates all possible actions with utility scores
3. Weights by personality traits and emotions
4. Chooses highest-scoring action
5. Updates emotions after execution

**Utility Calculation:**

```
Utility = (Base Action Value) × (Personality Factor) × (Emotion Modifier) × (Context Bonus)
```

Example:
- Action: "mine_resources"
- Base value: 0.6
- Personality (work_ethic=0.8): ×1.3
- Emotion (boredom=0.7): ×1.2
- Context (resources nearby): ×1.5
- **Final Utility: 1.40**

### 2. Memory System

Records all significant events:

**Memory Types:**
- `interaction` - Met another bot
- `trade_completed` - Successful trade
- `village_founded` - Joined/created village
- `achievement` - Milestone reached
- `conflict` - Dispute or combat
- `discovery` - Found new resource/location

**Storage:**

```sql
CREATE TABLE bot_memories (
  id INTEGER PRIMARY KEY,
  bot_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  emotional_impact REAL,
  timestamp INTEGER NOT NULL
);
```

### 3. Social System

Tracks relationships between bots:

**Relationship Attributes:**
- `trust_level` (0.0-1.0) - How much bot trusts another
- `friendship` (0.0-1.0) - Friendship strength
- `interactions` - Total interaction count
- `last_interaction` - Timestamp of last contact

**Trust Calculation:**

```javascript
trust = base_trust 
  + (positive_interactions × 0.1)
  - (negative_interactions × 0.2)
  + (successful_trades × 0.05)
  - (broken_promises × 0.3)
```

**Village Formation Threshold:** `trust >= 0.6`

### 4. Emotion System

7 dynamic emotional states:

| Emotion | Increases When | Decreases When |
|---------|---------------|----------------|
| Hunger | Time passes, low food | Eating |
| Safety | In village, daylight | Near mobs, low health |
| Loneliness | Alone for long time | Socializing |
| Boredom | Repetitive actions | New activities |
| Curiosity | Exploring, discovering | Familiar areas |
| Satisfaction | Goals completed | Goals failed |
| Stress | Combat, dangers | Resting, safety |

**Emotion Influence on Actions:**

- High hunger → Prioritize food gathering
- High loneliness → Seek social interactions
- High boredom → Choose exploration
- High stress → Seek safety/rest

---

## Trading & Economy

### Item Valuation

Dynamic pricing based on:

1. **Base Rarity**
   - Diamond: 100
   - Iron: 30
   - Stone: 5
   - Wood: 8

2. **Personality Modifier**
   - High ambition → Values valuable items more
   - High empathy → Values food/tools more
   - Low risk_tolerance → Values safety items more

3. **Supply/Demand**
   - Rare in inventory → Higher value
   - Abundant in village → Lower value

### Trade Flow

```
1. Bot A proposes trade to Bot B
   ├─ Offers: 10 iron_ingot
   └─ Requests: 2 diamond

2. System calculates fairness
   ├─ Offer value: 10 × 30 = 300
   ├─ Request value: 2 × 100 = 200
   └─ Fairness ratio: 300/200 = 1.5 (good deal for Bot B)

3. Bot B evaluates
   ├─ Checks trust level with Bot A
   ├─ Evaluates need for diamonds
   ├─ Compares fairness to threshold
   └─ Decision: ACCEPT (fairness 1.5 > threshold 0.8)

4. Exchange executed
   ├─ Items transferred
   ├─ Memory recorded for both bots
   ├─ Trust increased by 0.05
   └─ Trade logged in database
```

### Trade Negotiation

If fairness < threshold, bot can counter-offer:

```javascript
{
  "suggested_fairness": 0.9,
  "adjustment_factor": 1.2,
  "message": "Can you add 2 more iron?"
}
```

---

## Village Formation

### Formation Process

```
Step 1: Cluster Detection
├─ Find bots within 50 blocks of each other
└─ Check trust levels between all pairs

Step 2: Trust Evaluation
├─ Calculate average trust in cluster
└─ Require trust >= 0.6 for village

Step 3: Village Creation
├─ Generate village name
├─ Calculate center point
├─ Set territory radius (50 blocks)
└─ Elect leader

Step 4: Member Integration
├─ Add all bots to village
├─ Assign initial roles
├─ Record founding event
└─ Create shared memories
```

### Village Roles

| Role | Responsibilities | Selection Criteria |
|------|-----------------|-------------------|
| **Leader** | Decisions, goals | High ambition + sociability |
| **Builder** | Construction | High creativity + work_ethic |
| **Farmer** | Food production | High work_ethic + empathy |
| **Miner** | Resource gathering | High work_ethic + low risk |
| **Guard** | Defense | High aggression + low empathy |
| **Trader** | Commerce | High sociability + ambition |
| **Member** | General tasks | Default role |

### Shared Resources

Villages maintain communal storage:

```javascript
{
  wood: 500,
  stone: 300,
  iron: 50,
  food: 200
}
```

**Contribution:** Any member can add resources  
**Withdrawal:** Requires majority approval or leader permission

### Village Goals

Collective objectives voted on by members:

```javascript
{
  type: 'build_wall',
  description: 'Construct defensive wall around village',
  proposed_by: 'Alice',
  votes: { yes: 4, no: 1 },
  status: 'active',
  progress: 0.4
}
```

**Voting System:**
- Quorum: 50% of members must vote
- Majority: 60% yes votes to pass
- Implementation: Goal becomes active task

---

## Dashboard Guide

Access: **http://localhost:3001**

### Main Dashboard

**Top Section:**
- Total bot count
- Active villages
- Recent events (last 10)
- System status

**Bot List:**
- Name, personality type
- Health, food levels
- Current position
- Emotional state
- Village membership

**Village List:**
- Village name
- Population
- Territory center
- Active goals
- Resource summary

**Event Log:**
- Real-time event stream
- Filterable by type
- Timestamps
- Involved bots/villages

### Bot Detail View

Click any bot to see:
- Full personality traits
- Complete emotion breakdown
- Memory timeline
- Relationship network
- Trade history
- Achievement list

### Village Detail View

Click any village to see:
- Member roster with roles
- Resource inventory
- Goal progress
- Territory map
- Formation history
- Cultural traits

---

## Advanced Usage

### Adding New Actions

Edit `civilization/core/action_executor.js`:

```javascript
async executeFishing() {
  try {
    const waterBlock = this.bot.findBlock({
      matching: this.bot.registry.blocksByName.water.id,
      maxDistance: 16
    });
    
    if (!waterBlock) {
      return { success: false, reason: 'no_water' };
    }
    
    // Navigate to water
    await this.pathfinder.goto(new goals.GoalNear(
      waterBlock.position.x,
      waterBlock.position.y,
      waterBlock.position.z,
      2
    ));
    
    // Equip fishing rod
    const rod = this.bot.inventory.items().find(
      item => item.name === 'fishing_rod'
    );
    
    if (rod) {
      await this.bot.equip(rod, 'hand');
      // Fish for 30 seconds
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    return { success: true, action: 'fished' };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}
```

Register in decision engine:

```javascript
// civilization/core/decision_engine.js
const actions = [
  { id: 'fishing', base_utility: 0.4, motivation: 'resource_gathering' },
  // ... other actions
];
```

### Backup & Restore

**Backup:**

```bash
npm run civ:backup
```

Creates: `backups/civilization_YYYY-MM-DD_HH-MM-SS.db`

**Restore:**

```bash
cp backups/civilization_2025-10-19_14-30-00.db data/civilization/civilization.db
```

### Performance Tuning

For 10+ bots:

```javascript
// Increase action cooldown
this.actionCooldown = 20000; // 20 seconds instead of 15

// Reduce emotion update frequency
this.emotionUpdateInterval = setInterval(() => {
  this._updateEmotions();
}, 120000); // 2 minutes instead of 1

// Batch database writes
this.db.enableBatchMode();
```

---

## Troubleshooting

### Issue: Bots not spawning

**Check:**
1. Personality validation: `node civilization/scripts/validate_personalities.js`
2. Server connectivity: Verify MC_HOST and MC_PORT
3. Logs: Check console for errors

**Fix:**
```bash
# Validate all configs
node civilization/scripts/validate_personalities.js

# Test single bot connection
node -e "
const mineflayer = require('mineflayer');
const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'TestBot',
  auth: 'offline'
});
bot.once('spawn', () => console.log('SUCCESS'));
"
```

### Issue: Database locked

**Cause:** Multiple processes accessing same DB

**Fix:**
```bash
# Kill all node processes
pkill -9 node

# Restart
npm run civ:all
```

### Issue: High CPU usage

**Cause:** Too many bots or fast action intervals

**Fix:**
1. Reduce bot count in config
2. Increase action cooldown (15s → 30s)
3. Disable offline simulation during active play

### Issue: WebSocket connection failed

**Fix:**
```bash
# Check port availability
lsof -i :8080

# Use different port in .env
WS_PORT=8090
```

---

## FAQ

**Q: Is this actual AI?**  
A: No. All "intelligence" is simulated via algorithms (utility calculations, weighted decisions, state machines). No LLM/GPT.

**Q: How many bots can I run?**  
A: Depends on hardware. Tested up to 20 bots on 8GB RAM. Each bot uses ~100-200MB.

**Q: Can bots play on real servers?**  
A: Yes! Works on any Java Edition server. Use "microsoft" or "mojang" auth for online servers.

**Q: Do bots grief?**  
A: Only if personality has high aggression + low empathy. You control this via personality configs.

**Q: Can I add custom actions?**  
A: Yes! Edit `action_executor.js` and `decision_engine.js`. See Advanced Usage section.

**Q: Does it work on Bedrock?**  
A: No. Mineflayer only supports Java Edition.

**Q: How do I reset everything?**  
A: Delete `data/civilization/civilization.db` and restart.

---

## Contributing

Contributions welcome! Areas needing help:

- [ ] Complete building system (houses, farms, workshops)
- [ ] Combat AI improvements
- [ ] Cultural development features
- [ ] Advanced analytics dashboard
- [ ] Performance optimizations
- [ ] Unit tests

**Submit PRs to:** github.com/yourrepo/betterbender-civilization

---

## License

MIT License - See LICENSE file

---

## Credits

- **Mineflayer** - PrismarineJS team
- **Better-SQLite3** - Joshua Wise
- **BetterBender 2.0** - Original autonomous bot framework

---

**Built with ❤️ for the Minecraft automation community**

**Last Updated:** October 19, 2025  
**Version:** 1.0.0
