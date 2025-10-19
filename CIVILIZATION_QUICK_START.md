# 🏛️ BetterBender Civilization - Quick Start Guide

## 🚀 Get Started in 60 Seconds

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Choose Your Civilization

We have **5 preset civilizations** ready to go:

| Preset | Bots | Description |
|--------|------|-------------|
| **Tiny Village** | 5 | Perfect for testing - small cooperative settlement |
| **Small Town** | 10 | Growing community with specialized roles |
| **Medium City** | 20 | Established city with complex economy |
| **Large Metropolis** | 30 | Thriving metropolis with advanced specialization |
| **Mega Civilization** | 50 | Massive civilization with multiple villages |

### Step 3: Launch!

**Interactive Mode** (Recommended for first-time users):
```bash
npm run civilization
```

This will guide you through:
1. Selecting a civilization preset
2. Configuring your Minecraft server
3. Starting all bots automatically

**Quick Launch** (For experienced users):
```bash
# Launch a specific preset directly
npm run civ:tiny     # 5 bots
npm run civ:small    # 10 bots
npm run civ:medium   # 20 bots
npm run civ:large    # 30 bots
npm run civ:mega     # 50 bots
```

## 📊 What Happens When You Start?

1. **Bots Spawn**: All bots join the Minecraft server
2. **Personalities Activate**: Each bot has unique traits and preferences
3. **Roles Assign**: Bots automatically take on their designated jobs
4. **Society Begins**: Bots start building, trading, exploring, and socializing

## 🎮 Monitoring Your Civilization

### Web Dashboard
Open in your browser: **http://localhost:3001**

View:
- All active bots and their status
- Villages being formed
- Real-time events
- Relationship networks
- Resource gathering progress

### Console
Watch live updates in your terminal:
- Bot actions and decisions
- Building progress
- Social interactions
- Trading activities

## 🏗️ What Your Bots Will Do

### Builders 🔨
- Find optimal building locations
- Gather materials automatically
- Construct houses, farms, workshops
- Build village infrastructure (roads, bridges)

### Farmers 🌾
- Create and maintain farms
- Gather food for the community
- Plant and harvest crops
- Manage livestock (future feature)

### Miners ⛏️
- Search for ores and resources
- Mine stone and minerals
- Create underground tunnels
- Supply raw materials to builders

### Explorers 🗺️
- Discover new biomes
- Map the terrain
- Find valuable resources
- Report discoveries to the community

### Diplomats 🤝
- Greet and chat with other bots
- Form alliances and friendships
- Mediate conflicts
- Organize community events

### Traders 💰
- Offer items for trade
- Negotiate fair deals
- Establish trading routes
- Manage village economy

## ⚙️ Server Requirements

### Minecraft Server Setup
- **Recommended**: Vanilla or Paper server
- **Version**: 1.20.1 (configurable)
- **Settings**: 
  - PvP: Optional
  - Difficulty: Any
  - Online Mode: Offline (for bot authentication)
  
### Local Testing
```bash
# Use localhost for testing
Server: localhost
Port: 25565
```

### Remote Server
```bash
# Connect to any Minecraft server
Server: your-server.com
Port: 25565
```

## 🎯 Civilization Presets Explained

### 🏘️ Tiny Village (5 Bots)
**Perfect for beginners and testing**

Bots:
- 1 Builder (Mason) - Constructs buildings
- 1 Farmer (Harvest) - Grows food
- 1 Explorer (Scout) - Discovers resources
- 1 Diplomat (Harmony) - Builds relationships
- 1 Gatherer (Gather) - Collects materials

Best for:
- Learning how the system works
- Testing on limited hardware
- Watching bot interactions closely

### 🏘️ Small Town (10 Bots)
**Balanced community with role specialization**

Includes:
- 2 Builders for construction projects
- 2 Farmers for food production
- 2 Miners for resource gathering
- 1 Explorer for discovery
- 1 Diplomat for social cohesion
- 1 Trader for economy
- 1 Guard for protection

Best for:
- First real civilization
- Seeing villages form naturally
- Complex social dynamics

### 🏙️ Medium City (20 Bots)
**Established society with economy and culture**

Features:
- 4 Builders creating districts
- 3 Farmers with large-scale agriculture
- 4 Miners providing steady resources
- 2 Explorers mapping the world
- 2 Diplomats managing relations
- 2 Traders running markets
- 2 Guards protecting citizens
- 1 Artisan for crafting

Best for:
- Multiple villages
- Trading economy
- Cultural development
- Watching city growth

### 🌆 Large Metropolis (30 Bots)
**Thriving civilization with advanced features**

Automatically generates:
- 6 Builders (20%)
- 5 Farmers (15%)
- 5 Miners (15%)
- 3 Explorers (10%)
- 3 Diplomats (10%)
- 3 Traders (10%)
- 3 Guards (10%)
- 2 Gatherers (10%)

Best for:
- Multiple interconnected villages
- Complex economy
- Observing emergent behavior
- Long-term simulation

### 🏛️ Mega Civilization (50 Bots)
**Massive society with everything**

Includes:
- 10 Builders for massive projects
- 8 Farmers for food security
- 8 Miners for industrial resources
- 5 Explorers mapping vast territories
- 5 Diplomats managing alliances
- 5 Traders running commerce
- 5 Guards protecting borders
- 4 Gatherers for support

Best for:
- Epic civilizations
- Multiple competing villages
- War and peace scenarios
- Maximum emergent complexity

## 🛠️ Customization

### Modify Preset
Edit `civilization/presets/civilization_presets.json`:

```json
{
  "bots": [
    {
      "id": "custom_001",
      "name": "YourBot",
      "personality": "builder",
      "role": "construction",
      "priority_actions": ["build_house", "gather_wood"]
    }
  ]
}
```

### Create Your Own Preset
Copy an existing preset and modify:
- Bot count
- Personality distribution
- Role assignments
- Priority actions

## 🔧 Troubleshooting

### Bots Won't Connect
- Check Minecraft server is running
- Verify server address and port
- Ensure server is in offline mode
- Check firewall settings

### Bots Not Building
- They need materials first (will gather automatically)
- Building actions depend on personality
- Check console for errors
- Builders prioritize construction

### Dashboard Not Loading
- Check port 3001 is not in use
- Restart with `npm run civilization`
- Check console for errors

### Performance Issues
- Start with smaller presets (5-10 bots)
- Reduce bot count for your hardware
- Check CPU/RAM usage
- Use performance presets in CONFIG.json

## 📚 Next Steps

1. **Watch Your Civilization Grow**
   - Monitor the dashboard
   - Read console logs
   - Explore in Minecraft

2. **Experiment with Presets**
   - Try different civilization sizes
   - Compare bot behaviors
   - Watch social dynamics

3. **Customize Personalities**
   - Edit trait values
   - Create unique bot types
   - Test personality impact

4. **Advanced Features**
   - Enable offline simulation
   - Configure trading economy
   - Set up village governance

## 🆘 Need Help?

- Check CIVILIZATION_README.md for detailed documentation
- Review TESTING.md for verification procedures
- See CIVILIZATION_TODO.md for upcoming features
- Open an issue on GitHub

## 🎉 Have Fun!

You're now ready to launch your own AI civilization in Minecraft. Watch as bots form friendships, build societies, develop cultures, and create their own stories!

**Happy Civilizing! 🏛️**
