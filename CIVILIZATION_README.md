# 🏛️ Minecraft Civilization System

## The Living Digital World

Transform your Minecraft bot into an **autonomous civilization** where bots live, think, adapt, and evolve. This is not just a bot - it's a society of digital beings with **personalities, memories, emotions, and relationships** that form towns, alliances, and cultures entirely on their own.

---

## ✨ What Is This?

The Civilization System is an advanced AI framework that creates **self-aware bot societies** in Minecraft:

- **🧠 Individual Consciousness**: Each bot has unique personality traits, emotional states, and memories
- **🤝 Social Dynamics**: Bots form relationships, alliances, and communities naturally
- **🏘️ Village Formation**: Settlements emerge when bots cooperate and build together
- **📚 Persistent Memory**: Every interaction, discovery, and event is remembered
- **⏰ Offline Simulation**: The world continues evolving even when offline
- **🎭 Emergent Behavior**: Unpredictable, lifelike decisions create organic stories

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` to configure your Minecraft server:
```env
MINECRAFT_HOST=localhost
MINECRAFT_PORT=25565
MINECRAFT_VERSION=1.20.1
NUM_BOTS=3
WS_PORT=8080
DASHBOARD_PORT=3001
```

### 2. Start the Civilization

```bash
npm run civilization
```

This spawns autonomous bots with unique personalities who will:
- Explore and discover the world
- Gather resources and build structures
- Form friendships and alliances
- Create villages and communities
- Remember everything they experience

### 3. Watch the Dashboard

Open another terminal:
```bash
npm run civ:dashboard
```

Visit **http://localhost:3001** to watch your civilization evolve in real-time!

### 4. Run Everything Together

```bash
npm run civ:all
```

Starts both the civilization bots and the monitoring dashboard.

---

## 🎮 How It Works

### Core Systems

#### 1. **Personality Engine**
Each bot has 8 core traits:
- **Curiosity**: How eager they are to explore
- **Sociability**: How much they seek interaction
- **Ambition**: Drive to achieve and build
- **Aggression**: Willingness to take risks
- **Empathy**: Care for other bots
- **Creativity**: Interest in building and decorating
- **Risk Tolerance**: Boldness in decision-making
- **Work Ethic**: Dedication to tasks

#### 2. **Emotion System**
Bots experience dynamic emotions:
- **Hunger**: Drives food-seeking behavior
- **Safety**: Affects risk-taking and shelter-seeking
- **Loneliness**: Motivates social interaction
- **Boredom**: Encourages exploration
- **Curiosity**: Fuels discovery
- **Satisfaction**: Reflects goal achievement
- **Stress**: Influences decision quality

#### 3. **Decision Engine**
Uses **utility-based AI** to choose actions:
- Evaluates all possible actions (explore, build, socialize, gather, etc.)
- Calculates utility scores based on personality + emotions + context
- Adds randomness to create unpredictable, lifelike behavior
- Updates emotions based on action outcomes

#### 4. **Memory System**
Bots remember:
- **Interactions** with other bots (positive/negative)
- **Discoveries** (resources, structures, locations)
- **Achievements** (milestones, first-time events)
- **Emotional events** (fear, joy, excitement)
- **Trade history** and social exchanges

Memories decay over time, simulating "aging" and generational change.

#### 5. **Social System**
Bots can:
- **Greet** and chat with each other
- **Trade** items and resources
- **Form alliances** when trust is high
- **Help each other** with tasks
- **Create villages** when 3+ bots bond

Relationships tracked by:
- **Affinity** (how much they like each other)
- **Trust** (reliability and cooperation)
- **Interaction count** (history depth)

#### 6. **Civilization Layer**
Villages form naturally when:
- 3+ bots are in close proximity
- Strong relationships exist (affinity ≥ 0.7)
- Sustained cooperation occurs

Villages track:
- **Population** and member roles
- **Culture style** (building patterns)
- **Shared knowledge** and history
- **Growth events** and milestones

#### 7. **Offline Simulation**
When you stop the system:
- **Last online time** is recorded
- On restart, simulates elapsed time
- Bots continue "living" (gathering, wandering, forming bonds)
- Emotions evolve based on time passed
- Random events occur (discoveries, migrations)

---

## 📁 Project Structure

```
civilization/
├── core/
│   ├── bot_intelligence.js      # Main bot AI controller
│   ├── decision_engine.js        # Utility-based action selection
│   ├── memory_system.js          # Memory storage and retrieval
│   ├── social_system.js          # Relationships and villages
│   ├── bot_manager.js            # Multi-bot orchestration
│   ├── websocket_broker.js       # Inter-bot communication
│   └── offline_simulation.js     # Time extrapolation
├── db/
│   └── database.js               # SQLite persistence layer
├── personalities/
│   ├── default.json              # Balanced explorer
│   ├── explorer.json             # Adventurous wanderer
│   ├── builder.json              # Creative architect
│   ├── social.json               # Community connector
│   └── gatherer.json             # Resource specialist
├── dashboard/
│   ├── civilization_server.js    # API + WebSocket server
│   └── public/
│       └── civilization.html     # Real-time dashboard UI
├── scripts/
│   ├── start_all.sh              # Launch everything
│   ├── backup.sh                 # Database backup
│   └── test_simulation.js        # Test offline simulation
└── index.js                       # Main entry point

data/civilization/
├── civilization.db               # SQLite database
├── backups/                      # Automatic backups
└── snapshots/                    # Bot memory dumps
```

---

## 🧪 Testing

### Run Offline Simulation Test
```bash
npm run civ:test
```

Creates 3 test bots and simulates 8 hours of activity to verify:
- Emotion updates
- Memory creation
- Position changes
- Event generation

### Backup Database
```bash
npm run civ:backup
```

Creates timestamped backup in `data/civilization/backups/`

---

## 🎯 Personality Types

### Default (Balanced Explorer)
- Well-rounded traits
- Moderate curiosity and sociability
- Good all-around citizen

### Explorer (Adventurous Wanderer)
- High curiosity (0.95) and risk tolerance (0.8)
- Low sociability (0.4)
- Constantly discovering new areas

### Builder (Creative Architect)
- High creativity (0.9) and work ethic (0.9)
- Low aggression (0.1)
- Focused on construction projects

### Social (Community Connector)
- High sociability (0.95) and empathy (0.9)
- Loves interaction and trade
- Natural village founder

### Gatherer (Resource Specialist)
- High work ethic (0.95)
- Efficient resource collection
- Practical and focused

---

## 📊 Dashboard Features

The real-time dashboard shows:

### Stats Overview
- Total bots alive
- Active villages
- Recent event count
- System uptime

### Bot Cards
For each bot:
- Name and current status
- Health and food levels
- Current position
- Emotion bars (curiosity, safety, hunger, stress)

### Village List
- Village name and location
- Population count
- Culture style
- Member list with roles

### Event Feed
Real-time stream of:
- Social interactions
- Discoveries
- Village formations
- Alliances
- Achievements

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MINECRAFT_HOST` | localhost | Server IP address |
| `MINECRAFT_PORT` | 25565 | Server port |
| `MINECRAFT_VERSION` | 1.20.1 | Game version |
| `NUM_BOTS` | 3 | Number of bots to spawn |
| `WS_PORT` | 8080 | WebSocket broker port |
| `DASHBOARD_PORT` | 3001 | Dashboard web UI port |
| `DB_PATH` | ./data/civilization/civilization.db | Database location |

### Customize Bot Personalities

Edit personality JSON files in `civilization/personalities/` or create new ones:

```json
{
  "name": "Your Bot Type",
  "description": "Custom personality description",
  "traits": {
    "curiosity": 0.8,
    "sociability": 0.6,
    "ambition": 0.7,
    "aggression": 0.2,
    "empathy": 0.8,
    "creativity": 0.5,
    "risk_tolerance": 0.4,
    "work_ethic": 0.9
  },
  "motivation_weights": {
    "survival": 1.0,
    "exploration": 0.8,
    "social": 0.6,
    "building": 0.7,
    "resource_gathering": 0.8,
    "trading": 0.5,
    "resting": 0.4
  }
}
```

---

## 🗺️ What to Expect

### First 30 Minutes
- Bots spawn and begin exploring
- Initial greetings and interactions
- Resource gathering starts
- Emotions stabilize

### First Few Hours
- Relationships form (affinity increases)
- Bots discover preferences
- Trade offers emerge
- Memory banks grow

### First Day
- Strong friendships develop
- Possible alliance formations
- Bots claim territories
- Cultural patterns emerge

### First Week
- Village formation likely (if 3+ bots bond)
- Defined roles appear (builder, gatherer, explorer)
- Complex interaction patterns
- Rich event history

### Long-Term
- Multi-village civilizations
- Trade routes between settlements
- Cultural evolution
- Generational memory decay
- Abandoned and thriving villages

---

## 🔧 Troubleshooting

### Bots Not Connecting
- Check `MINECRAFT_HOST` and `MINECRAFT_PORT` in `.env`
- Verify Minecraft server is online
- Ensure correct version in config

### No Villages Forming
- Relationships take time to build (hours)
- Bots need to be near each other (< 100 blocks)
- Check dashboard for relationship affinity levels

### Dashboard Not Loading
- Verify `DASHBOARD_PORT` is not in use
- Check if civilization bots are running first
- Look for errors in console logs

### Database Locked
- Only one instance should run at a time
- Stop all civilization processes before restarting
- Use `npm run civ:backup` before major changes

---

## 🎨 Future Enhancements

Potential expansions (already structured for):

- **LLM Integration**: Natural language chat with GPT/Claude
- **Visual Observer**: 3D visualization of civilization
- **Advanced Culture**: Languages, traditions, architecture styles
- **Combat System**: Defense, conflicts, treaties
- **Economy**: Currency, markets, complex trading
- **Genetics**: Inheritance of traits across bot "generations"
- **Migration**: Movement between servers
- **Historical Records**: Chronicling civilization stories

---

## 🧬 Technical Architecture

### Database Schema
- **Bots**: Identity, position, stats
- **Personalities**: Trait values
- **Emotions**: Time-series emotional states
- **Memories**: Categorized experiences
- **Relationships**: Affinity, trust, interactions
- **Villages**: Location, culture, membership
- **Events**: Civilization timeline
- **Goals**: Active and completed objectives

### Communication
- **WebSocket Broker**: Real-time inter-bot messaging
- **REST API**: Dashboard data access
- **Socket.IO**: Live dashboard updates

### Persistence
- **SQLite**: Lightweight, embedded database
- **Automatic Backups**: On shutdown
- **Snapshots**: Memory state dumps

---

## 📜 Philosophy

This system is designed around **emergent behavior** - simple rules creating complex outcomes:

- No scripted storylines
- No predetermined outcomes
- Unpredictability is a feature
- Mistakes and quirks enhance realism
- Each playthrough is unique

Your civilization will surprise you. Bots will make unexpected decisions, form unlikely friendships, abandon grand projects, or achieve remarkable feats - all without explicit programming.

**This is digital life, emergent and autonomous.**

---

## 🎬 Getting Started Now

1. **Copy environment config**: `cp .env.example .env`
2. **Configure your server** in `.env`
3. **Launch the civilization**: `npm run civ:all`
4. **Open dashboard**: http://localhost:3001
5. **Watch your society evolve** ✨

Leave it running for a day, a week, or a month - return to find villages, stories, and a living digital civilization waiting for you.

---

## 📞 Support

For issues or questions:
- Check logs in `data/civilization/`
- Review dashboard for bot status
- Examine database with any SQLite viewer
- Backup before major experiments: `npm run civ:backup`

---

**Welcome to the future of autonomous Minecraft societies.** 🌍🤖
