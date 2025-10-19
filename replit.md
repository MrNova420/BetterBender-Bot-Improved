# BetterBender 2.0 - Autonomous Minecraft Bot + Civilization System

### Overview
BetterBender 2.0 is an autonomous Minecraft bot designed for 24/7 operation on low-to-medium end devices. It features advanced player simulation with autonomous goal generation, home building, community interaction, and dynamic task creation, allowing the bot to play the game like a real player. Built with Mineflayer and Node.js, it is optimized for minimal resource usage and includes comprehensive safety features for continuous operation.

A significant new feature is the **Civilization System**, which enables running multiple bots as an autonomous society. These bots possess unique personalities, emotions, memories, and relationships, forming friendships, creating villages, and developing cultures that evolve continuously, even offline. The system aims to create a dynamic, evolving digital society within Minecraft.

### User Preferences
Preferred communication style: Simple, everyday language.

### System Architecture

**UI/UX Decisions:**
- **Web Dashboard:** An Express.js + Socket.IO-based real-time control panel on port 5000 provides live monitoring (health, food, position, tasks, inventory), mode switching, command execution, and bot settings management. It offers visual warnings for low health/food.

**Technical Implementations:**
- **Application Type:** Single-process Node.js application running a Minecraft bot client and a web server for status monitoring.
- **Bot Client Architecture:** Utilizes Mineflayer with a plugin-based architecture (e.g., mineflayer-pathfinder), an event-driven pattern, and a Promise-based queue for sequential command execution. Includes auto-reconnection logic.
- **Autonomous Systems:**
    - **AutonomousGoalGenerator:** Dynamically creates goals based on bot state, inventory, health, nearby players, and milestones.
    - **HomeBuilder:** Finds optimal building locations using a scoring system, considering terrain, resources, and community proximity.
    - **ProgressionSystem:** Tracks achievements and unlocks new goals for bot progression.
    - **Enhanced Player Mode:** Provides fully autonomous player simulation, including home building, resource gathering, trading, exploration, and community interaction.
- **Civilization System:**
    - **Multi-bot AI society:** Supports unlimited autonomous bots with unique personalities (8 traits), dynamic emotions (7 states), and memories.
    - **Social & Relationship System:** Bots form friendships (0.0-1.0 trust scale), remember interactions, and engage in communication, cooperation, and alliances.
    - **Village Formation:** Bots automatically form villages based on trust levels, with leader election and role assignment.
    - **Offline Simulation:** World evolution continues offline via time-tick extrapolation.
    - **Decision Engine:** Utility-based AI selects actions based on personality, emotions, context, and needs. Supports specific action parameters for building, gathering, and trading.
    - **Trading System:** Full economy with item valuation, trust-based pricing, and negotiation.
    - **Building System:** Comprehensive construction system with 7 structure types (small/medium houses, farms, workshops, storage, roads, bridges). Includes material requirements, step-by-step building logic, progress tracking, and actual block placement. Total of 700+ lines of building logic.
    - **Material Gatherer:** Automatic resource acquisition system that gathers materials before building. Uses direct bot actions to avoid ActionExecutor deadlocks. Supports wood, stone, ores, crafting, and smelting.
    - **Civilization Presets:** 5 pre-configured civilization templates (Tiny Village 5 bots, Small Town 10 bots, Medium City 20 bots, Large Metropolis 30 bots, Mega Civilization 50 bots). Each includes balanced personality distributions and role assignments ready to use out-of-the-box.
    - **Preset Generator:** Automatic bot configuration generator that creates complete civilization setups with personalities, roles, skills, and server connections.
    - **Interactive Launcher:** User-friendly civilization starter with guided setup, server configuration, and automatic initialization.
    - **Configuration Validator:** Validates civilization configurations with helpful error messages and warnings. Checks bot IDs, names, personalities, roles, and server settings.
    - **Action Executor:** Enables bots to mine, gather, build complete structures, craft, combat, trade, socialize, explore, and rest.
    - **Event System:** Records significant civilization events (births, discoveries, conflicts).
    - **WebSocket Broker:** Facilitates inter-bot communication.
    - **SQLite Persistence:** Stores all memories, relationships, emotions, villages, and events.
- **Configuration System:** JSON-based configuration in `config/settings.json` (gitignored) with an `example.settings.json` template.
- **Anti-AFK Mechanism:** Configurable periodic movements to prevent AFK kicks.
- **Chat System:** Generates randomized, natural-sounding chat messages with dynamic delays.
- **Authentication System:** Supports Microsoft (OAuth device code), Mojang (legacy password), and Offline authentication. Handles server-side authentication plugins.
- **Pathfinding:** Integrates `mineflayer-pathfinder` for goal-based navigation.
- **Performance Optimizations:** Reduced interval frequencies, batch writes for file I/O, process-specific memory tracking, and performance presets.
- **Safety Features:** CPU averaging, startup phase exemption, thermal protection (for Termux), and battery awareness (for Termux).

**Feature Specifications:**
- **Autonomous goal generation:** Bots create their own objectives dynamically.
- **Home building:** Bots find locations and construct bases.
- **Community interaction:** Bots interact with other players/bots, trade, and socialize.
- **Progression:** Bots follow a progressive gameplay loop from survival to advanced activities.
- **Resource management:** Optimized for low RAM (80-300MB).
- **Error handling:** Robust error handling for continuous operation.
- **Deployment:** Multi-platform support (Node.js, Replit, Termux) with PM2 scripts.

**System Design Choices:**
- **Mineflayer:** Chosen for its maturity, plugin ecosystem, and version-agnostic design.
- **Single JSON Configuration:** Simplifies deployment and management.
- **Promise-based Command Queue:** Prevents rate limiting and ensures sequential execution.
- **OAuth Device Code:** For secure Microsoft authentication without password storage.
- **Event-Driven Architecture:** For extensibility and separation of concerns.
- **Modular Auto-Systems:** Toggleable auto-eat, auto-defend, auto-reconnect for fine-grained control.

### External Dependencies

**Third-Party Libraries:**
- `mineflayer` (v4.3.0): Core Minecraft bot implementation.
- `mineflayer-pathfinder` (v2.1.1): Pathfinding and navigation.
- `minecraft-data`: For version-specific game data.
- `express` (v4.18.1): HTTP server for the web dashboard.
- `@azure/msal-node` (v1.9.1): Microsoft authentication.
- `@xboxreplay/xboxlive-auth` (v3.3.3): Xbox Live authentication.

**External Services:**
- **Minecraft Servers:** Connects to any Minecraft Java Edition server (version-configurable).
- **Microsoft/Xbox Live Services:** Used for Microsoft account authentication.

**Infrastructure Requirements:**
- **Runtime Environment:** Node.js 22+ runtime.
- **Network:** TCP connectivity to Minecraft servers, HTTPS for Microsoft authentication.
- **Persistent Storage:** For configuration and SQLite database (Civilization System).
- **Ports:** Inbound port 5000 (Express dashboard), port 3001 (Civilization dashboard), Outbound Minecraft server port (default 25565), and HTTPS 443 for Microsoft authentication.

### Recent Changes (Oct 19, 2025)

**FULL INTEGRATION COMPLETE - Unified System**
- ✅ Merged single bot and civilization into ONE unified project
- ✅ Created unified launcher (npm start) - choose mode at runtime
- ✅ Single bot now uses civilization BuildingSystem and MaterialGatherer
- ✅ Shared components: Logger, BuildingSystem, MaterialGatherer, Config systems
- ✅ Both modes coexist peacefully with proper integration
- ✅ README updated to reflect unified architecture
- ✅ Package.json unified with npm start as main entry point
- ✅ All systems tested and verified working together

**Phase 1: Building System Complete**
- ✅ Built comprehensive BuildingSystem class (700+ lines) with 7 structure types
- ✅ Implemented MaterialGatherer for automatic resource acquisition
- ✅ Fixed architectural deadlock by refactoring MaterialGatherer to use direct bot actions
- ✅ Created Civilization Preset System with 5 ready-to-use templates
- ✅ Built PresetGenerator for automatic bot configuration
- ✅ Created interactive startup wizard (civilization/scripts/start_civilization.js)
- ✅ Added NPM quick-launch scripts (npm run civilization, civ:tiny, civ:small, etc.)
- ✅ Created comprehensive documentation (CIVILIZATION_QUICK_START.md)
- ✅ Updated README.md with civilization features and usage guides
- ✅ Added ConfigValidator for configuration validation and error checking

**User Experience Improvements:**
- Users can now launch civilizations in 60 seconds with `npm run civilization`
- No manual configuration required - presets are ready to use
- Interactive wizard guides users through server setup
- Quick-launch commands for each civilization size
- Comprehensive documentation for all levels of users

**Technical Improvements:**
- Material gathering no longer causes ActionExecutor deadlocks
- Direct bot action implementation for resource acquisition
- Validated configurations prevent startup errors
- Balanced role distributions for all civilization sizes
- Personality library with 5 distinct types (builder, explorer, gatherer, social, default)
- Role configurations with priority actions and skills