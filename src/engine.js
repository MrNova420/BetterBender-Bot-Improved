const mineflayer = require('mineflayer');
const Logger = require('./core/logger');
const SafetyMonitor = require('./core/safety');
const TaskManager = require('./core/taskManager');
const StateManager = require('./core/stateManager');
const ActivityTracker = require('./core/activityTracker');
const ReconnectManager = require('./utils/reconnect');
const { getAuthOptions } = require('./utils/auth');
const fs = require('fs');
const path = require('path');

class BotEngine {
  constructor(config) {
    this.config = config;
    this.logger = new Logger(config.logging);
    this.safety = new SafetyMonitor(config.safety, this.logger);
    this.taskManager = new TaskManager(config.tasks, this.logger);
    this.stateManager = new StateManager({ persistDir: 'data' }, this.logger);
    this.activityTracker = new ActivityTracker({ persistDir: 'data' }, this.logger);
    this.reconnectManager = new ReconnectManager(config.reconnect, this.logger);
    
    this.bot = null;
    this.addons = new Map();
    this.currentMode = config.mode?.current || 'afk';
    this.running = false;
    this.shuttingDown = false;
    this.eventHandlers = new Map();
    
    this._setupSafetyCallbacks();
    this._setupSignalHandlers();
  }
  
  _setupSafetyCallbacks() {
    this.safety.on('throttle', (metrics) => {
      this.logger.warn('Safety throttle activated', metrics);
      if (this.currentMode === 'player' && this.config.safety.autoThrottle) {
        this.switchMode('afk');
      }
      this.taskManager.pause();
    });
    
    this.safety.on('restore', (metrics) => {
      this.logger.info('Safety throttle deactivated', metrics);
      this.taskManager.resume();
    });
  }
  
  _setupSignalHandlers() {
    const shutdown = () => {
      this.logger.info('Shutdown signal received');
      this.stop();
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
  
  registerAddon(addon) {
    if (!addon.name || !addon.init) {
      throw new Error('Invalid addon: must have name and init method');
    }
    
    this.addons.set(addon.name, addon);
    this.logger.info(`Addon registered: ${addon.name}`);
  }
  
  async start() {
    if (this.running) {
      this.logger.warn('Bot already running');
      return;
    }
    
    this.logger.info('Starting BetterBender 2.0...');
    this.running = true;
    
    this.safety.start();
    
    this._connect();
  }
  
  _connect() {
    if (this.shuttingDown) return;
    
    const authOptions = getAuthOptions(this.config.auth);
    
    const botOptions = {
      host: this.config.server.host,
      port: this.config.server.port,
      username: authOptions.username,
      auth: authOptions.auth,
      version: this.config.server.version,
      hideErrors: false
    };
    
    if (authOptions.password) {
      botOptions.password = authOptions.password;
    }
    
    this.logger.info(`Connecting to ${this.config.server.host}:${this.config.server.port} as ${authOptions.username}`);
    
    try {
      this.bot = mineflayer.createBot(botOptions);
      this._setupBotEvents();
    } catch (err) {
      this.logger.error('Failed to create bot:', err.message);
      this._handleDisconnect('Failed to create bot');
    }
  }
  
  _setupBotEvents() {
    this.bot.once('login', () => {
      this.logger.info('Bot logged in successfully');
      this.reconnectManager.reset();
      this.activityTracker.record('login', { server: this.config.server.host });
    });
    
    this.bot.once('spawn', () => {
      this.logger.info('Bot spawned in world');
      this._restoreState();
      this._initializeAddons();
      this._setupPositionTracking();
    });
    
    this.bot.on('error', (err) => {
      this.logger.error('Bot error:', err.message);
    });
    
    this.bot.on('kicked', (reason) => {
      this.logger.warn('Bot kicked:', reason);
      this._handleDisconnect('Kicked');
    });
    
    this.bot.on('end', () => {
      this.logger.info('Bot disconnected');
      this._handleDisconnect('Connection ended');
    });
    
    this.bot.on('death', () => {
      this.logger.warn('Bot died');
      const pos = this.bot.entity ? this.bot.entity.position : null;
      this.activityTracker.record('death', { position: pos });
      this._emit('bot_death');
    });
    
    this.bot.on('health', () => {
      if (this.bot.health <= 5) {
        this.logger.warn(`Low health: ${this.bot.health}`);
      }
    });
    
    this.bot.on('messagestr', (message) => {
      this._emit('chat_message', { message });
    });
  }
  
  _restoreState() {
    const savedState = this.stateManager.getState();
    
    if (savedState.currentMode && savedState.currentMode !== this.currentMode) {
      this.logger.info(`Restoring mode: ${savedState.currentMode}`);
      this.currentMode = savedState.currentMode;
      
      setTimeout(() => {
        const targetAddon = this.addons.get(savedState.currentMode);
        if (targetAddon && targetAddon.enable) {
          targetAddon.enable();
          this.logger.info(`Mode ${savedState.currentMode} activated`);
        }
      }, 2000);
    }
    
    if (savedState.lastPosition) {
      this.logger.info(`Last known position: (${Math.round(savedState.lastPosition.x)}, ${Math.round(savedState.lastPosition.y)}, ${Math.round(savedState.lastPosition.z)})`);
      this.logger.info(`Explored ${savedState.exploredChunks?.length || 0} chunks`);
    }
    
    if (savedState.playerRelationships) {
      const playerCount = Object.keys(savedState.playerRelationships).length;
      if (playerCount > 0) {
        this.logger.info(`Remembering ${playerCount} players`);
      }
    }
    
    if (savedState.landmarks && savedState.landmarks.length > 0) {
      this.logger.info(`Restored ${savedState.landmarks.length} landmarks`);
    }
    
    const taskStatus = this.taskManager.getStatus();
    if (taskStatus.queueLength > 0) {
      this.logger.info(`Resuming with ${taskStatus.queueLength} queued tasks`);
      this.taskManager.resume();
    }
  }
  
  _setupPositionTracking() {
    setInterval(() => {
      if (this.bot && this.bot.entity && this.bot.entity.position) {
        this.stateManager.updatePosition(this.bot.entity.position);
        
        const chunkX = Math.floor(this.bot.entity.position.x / 16);
        const chunkZ = Math.floor(this.bot.entity.position.z / 16);
        this.stateManager.addExploredChunk(chunkX, chunkZ);
      }
    }, 10000);
  }
  
  _initializeAddons() {
    this.logger.info('Initializing addons...');
    
    for (const [name, addon] of this.addons) {
      try {
        addon.init(this.bot, this);
        this.logger.info(`Addon initialized: ${name}`);
      } catch (err) {
        this.logger.error(`Failed to initialize addon ${name}:`, err.message);
      }
    }
    
    this._emit('bot_ready');
  }
  
  _handleDisconnect(reason) {
    if (this.shuttingDown) return;
    
    this.logger.info(`Handling disconnect: ${reason}`);
    
    for (const [name, addon] of this.addons) {
      if (addon.cleanup) {
        try {
          addon.cleanup();
        } catch (err) {
          this.logger.error(`Addon cleanup failed: ${name}`, err.message);
        }
      }
    }
    
    if (this.reconnectManager.shouldReconnect()) {
      this.reconnectManager.scheduleReconnect(() => {
        this._connect();
      });
    } else {
      this.logger.error('Reconnect disabled or max attempts reached');
      this.running = false;
    }
  }
  
  switchMode(newMode) {
    if (newMode === this.currentMode) return;
    
    this.logger.info(`Switching mode: ${this.currentMode} -> ${newMode}`);
    
    for (const [name, addon] of this.addons) {
      if (addon.disable) {
        addon.disable();
      }
    }
    
    const oldMode = this.currentMode;
    this.currentMode = newMode;
    this.stateManager.updateMode(newMode);
    this.activityTracker.record('mode_change', { from: oldMode, to: newMode });
    
    const targetAddon = this.addons.get(newMode);
    if (targetAddon && targetAddon.enable) {
      targetAddon.enable();
    }
    
    this._emit('mode_changed', { mode: newMode });
  }
  
  stop() {
    if (this.shuttingDown) return;
    
    this.shuttingDown = true;
    this.logger.info('Stopping bot...');
    
    this.reconnectManager.cancel();
    
    if (this.bot) {
      this.bot.quit();
      this.bot = null;
    }
    
    for (const [name, addon] of this.addons) {
      if (addon.cleanup) {
        try {
          addon.cleanup();
        } catch (err) {
          this.logger.error(`Addon cleanup failed: ${name}`, err.message);
        }
      }
    }
    
    this.safety.stop();
    this.stateManager.cleanup();
    this.activityTracker.cleanup();
    this.logger.shutdown();
    
    this.running = false;
    this.logger.info('Bot stopped');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
  
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }
  
  _emit(event, data = {}) {
    if (this.eventHandlers.has(event)) {
      for (const handler of this.eventHandlers.get(event)) {
        try {
          handler(data);
        } catch (err) {
          this.logger.error(`Event handler error for ${event}:`, err.message);
        }
      }
    }
  }
  
  getBot() {
    return this.bot;
  }
  
  getSafety() {
    return this.safety;
  }
  
  getTaskManager() {
    return this.taskManager;
  }
  
  getLogger() {
    return this.logger;
  }
  
  getStatus() {
    return {
      running: this.running,
      mode: this.currentMode,
      connected: this.bot && this.bot.player,
      health: this.bot ? this.bot.health : 0,
      food: this.bot ? this.bot.food : 0,
      position: this.bot && this.bot.entity ? this.bot.entity.position : null,
      safety: this.safety.getMetrics(),
      tasks: this.taskManager.getStatus(),
      state: this.stateManager.getState()
    };
  }
  
  getStateManager() {
    return this.stateManager;
  }
  
  getActivityTracker() {
    return this.activityTracker;
  }
}

if (require.main === module) {
  const configPath = process.argv[2] || 'CONFIG.json';
  
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    console.log('Please copy CONFIG.example.json to CONFIG.json and configure it');
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const engine = new BotEngine(config);
  
  const AFKAddon = require('../addons/afk');
  const PlayerAddon = require('../addons/player');
  
  engine.registerAddon(AFKAddon);
  engine.registerAddon(PlayerAddon);
  
  engine.start();
}

module.exports = BotEngine;
