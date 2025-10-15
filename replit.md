# BetterSMP Bot - Minecraft Server Activity Bot

## Overview

BetterSMP Bot is a production-ready Minecraft bot designed for 24/7 operation with full dashboard control. It supports all account types (offline/cracked, Microsoft OAuth, and Mojang legacy) and provides two operational modes: Basic (server activity & chat) and Advanced (full automation with mining, building, farming, and combat). The bot features a comprehensive web dashboard with real-time monitoring, mode switching, inventory tracking, health alerts, and advanced controls for auto-eat, auto-defend, and auto-reconnect. Built with Mineflayer and Node.js, it's optimized for low resource usage (~90MB RAM) and supports deployment on Replit, Termux (Android), and standard Node environments. The project emphasizes stability, ease of setup, and complete control through both in-game commands and web interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Type
Single-process Node.js application running a Minecraft bot client and a basic web server for status monitoring.

### Core Components

**Bot Client Architecture**
- Utilizes Mineflayer for Minecraft protocol implementation.
- Features a plugin-based architecture, including mineflayer-pathfinder for navigation.
- Employs an event-driven pattern for handling server interactions.
- Uses a Promise-based queue for sequential command execution to prevent server spam.
- Includes auto-reconnection logic with configurable delays.

**Configuration System**
- JSON-based configuration in `config/settings.json`, which is gitignored for security.
- Hierarchical structure for bot account, server connection, positioning, and features.
- Provides `config/example.settings.json` as a template; does not use environment variables.

**Anti-AFK Mechanism**
- Executes periodic movements (jump, sneak) to prevent AFK kicks, configurable for different server detection systems.

**Chat System**
- Generates randomized, natural-sounding chat messages from a diverse pool.
- Incorporates dynamic delays between messages for realistic timing.
- Supports chat logging.

**Authentication System**
- Microsoft: OAuth device code flow (no password in config, browser-based authentication)
- Mojang: Legacy password-based authentication for pre-migration accounts
- Offline: No authentication required for cracked servers
- Supports server-side authentication plugins (e.g., `/register`, `/login`) with configurable auto-authentication
- Handles event-based detection of authentication prompts

**Pathfinding (Optional)**
- Integrates `mineflayer-pathfinder` for goal-based navigation.

**Web Dashboard (Enhanced)**
- Express.js + Socket.IO-based real-time control panel on port 5000
- Real-time mode switching (Basic/Advanced) with instant feedback
- Live monitoring: health, food, position, tasks, statistics, inventory
- Command execution panel for all bot operations
- Microsoft login display: shows device code and authentication URL
- Bot settings panel: toggle auto-eat, auto-defend, auto-reconnect, health alerts
- Inventory tracking: real-time display of all items bot is carrying
- Health alerts: visual warnings when health < 8 or food < 6
- Task queue visualization and management

### Technology Stack

**Runtime & Core Libraries**
- Node.js 14+ (currently upgraded to v22).
- Mineflayer (v4.3.0) for core bot functionality.
- mineflayer-pathfinder (v2.1.1) for navigation.
- Express.js (v4.18.1) for the web server.

**Authentication Support**
- Mojang authentication.
- Microsoft authentication via `@azure/msal-node` and `@xboxreplay/xboxlive-auth`.
- Offline mode support.

### Deployment Architecture

**Multi-Platform Support**
- Compatible with standard Node.js environments, Replit cloud, and Termux for Android.
- Includes PM2 scripts for process management.

### Design Decisions

- **Mineflayer Choice**: Selected for its maturity, plugin ecosystem, and version-agnostic design.
- **Single JSON Configuration**: Simplifies deployment, version control, and separation of concerns.
- **Promise-based Command Queue**: Prevents rate limiting, ensures sequential execution, and improves error handling.
- **OAuth Device Code for Microsoft**: Implements modern authentication flow, avoiding password storage and supporting 2FA/MFA.
- **Comprehensive Web Dashboard**: Full-featured control panel with real-time WebSocket updates for complete remote management.
- **Event-Driven Architecture**: Naturally fits the Minecraft protocol, allowing for easy extension and clean separation of concerns.
- **Modular Auto-Systems**: Auto-eat, auto-defend, and auto-reconnect can be toggled independently for fine-grained control.

## External Dependencies

### Third-Party Libraries

**Minecraft Protocol & Bot Framework**
- `mineflayer` (v4.3.0): Core Minecraft bot implementation.
- `mineflayer-pathfinder` (v2.1.1): Pathfinding and navigation.
- `minecraft-data`: Used for version-specific game data.

**Web Server**
- `express` (v4.18.1): HTTP server for status and health monitoring.

**Authentication Services**
- `@azure/msal-node` (v1.9.1): Microsoft authentication library.
- `@xboxreplay/xboxlive-auth` (v3.3.3): Xbox Live authentication.

### External Services

**Minecraft Servers**
- Connects to any Minecraft Java Edition server (version-configurable), supporting both online and offline modes, and authentication plugins.

**Microsoft/Xbox Live Services**
- Utilized when the bot account type is set to "microsoft" for OAuth flow.

### Infrastructure Requirements

**Runtime Environment**
- Node.js 22+ runtime.
- Network connectivity to Minecraft servers (TCP) and HTTPS for Microsoft authentication.
- Persistent storage for configuration files.

**Network & Ports**
- Inbound: Port 5000 (Express web dashboard, bound to 0.0.0.0).
- Outbound: Minecraft server port (default 25565, configurable) and HTTPS 443 for Microsoft authentication.