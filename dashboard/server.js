const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

class DashboardServer {
  constructor(config, engine = null) {
    this.config = config;
    this.engine = engine;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIO(this.server);
    this.adminToken = config.dashboard?.adminToken || 'CHANGE_THIS_TOKEN_NOW';
    this.port = config.dashboard?.port || 5000;
    this.connectedClients = new Set();
    
    this._setupExpress();
    this._setupSocketIO();
  }
  
  _setupExpress() {
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use(express.json());
    
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    this.app.get('/api/status', (req, res) => {
      if (this.engine) {
        res.json(this.engine.getStatus());
      } else {
        res.json({ running: false, message: 'Bot not initialized' });
      }
    });
    
    this.app.get('/api/activities', this._authenticate.bind(this), (req, res) => {
      if (this.engine) {
        const options = {
          type: req.query.type,
          limit: parseInt(req.query.limit) || 50
        };
        const activities = this.engine.getActivityTracker().getActivities(options);
        res.json({ activities });
      } else {
        res.json({ activities: [] });
      }
    });
    
    this.app.get('/api/activities/stats', this._authenticate.bind(this), (req, res) => {
      if (this.engine) {
        const stats = this.engine.getActivityTracker().getStats();
        res.json(stats);
      } else {
        res.json({ total: 0 });
      }
    });
    
    this.app.get('/api/goals', this._authenticate.bind(this), (req, res) => {
      if (this.engine) {
        const playerAddon = this.engine.addons.get('player');
        if (playerAddon && playerAddon.progression) {
          res.json({ goals: playerAddon.progression.getProgress() });
        } else {
          res.json({ goals: {} });
        }
      } else {
        res.json({ goals: {} });
      }
    });
    
    this.app.get('/api/minecraft-progress', this._authenticate.bind(this), (req, res) => {
      if (this.engine) {
        const playerAddon = this.engine.addons.get('player');
        if (playerAddon && playerAddon.getMinecraftProgress) {
          res.json({ progress: playerAddon.getMinecraftProgress() });
        } else {
          res.json({ progress: null });
        }
      } else {
        res.json({ progress: null });
      }
    });
    
    this.app.get('/api/ai-status', this._authenticate.bind(this), (req, res) => {
      if (this.engine) {
        const playerAddon = this.engine.addons.get('player');
        if (playerAddon && playerAddon.getAIStatus) {
          res.json({ ai: playerAddon.getAIStatus() });
        } else {
          res.json({ ai: null });
        }
      } else {
        res.json({ ai: null });
      }
    });
    
    this.app.post('/api/goals', this._authenticate.bind(this), (req, res) => {
      if (this.engine) {
        const playerAddon = this.engine.addons.get('player');
        if (playerAddon && playerAddon.progression) {
          const { category, goalName, target } = req.body;
          
          if (!playerAddon.progression.goals[category]) {
            playerAddon.progression.goals[category] = {};
          }
          
          playerAddon.progression.goals[category][goalName] = {
            target: parseInt(target) || 10,
            current: 0,
            priority: 3
          };
          
          playerAddon.progression._saveProgress();
          res.json({ success: true, message: 'Goal added' });
        } else {
          res.json({ success: false, error: 'Player mode not available' });
        }
      } else {
        res.json({ success: false, error: 'Bot not initialized' });
      }
    });
    
    this.app.get('/api/config', this._authenticate.bind(this), (req, res) => {
      const safeConfig = { ...this.config };
      if (safeConfig.dashboard) {
        delete safeConfig.dashboard.adminToken;
      }
      res.json(safeConfig);
    });
    
    this.app.post('/api/server/config', this._authenticate.bind(this), (req, res) => {
      const { host, port, version } = req.body;
      
      if (!host) {
        return res.json({ success: false, error: 'Server host is required' });
      }
      
      this.config.server.host = host;
      this.config.server.port = parseInt(port) || 25565;
      if (version) {
        this.config.server.version = version;
      } else {
        delete this.config.server.version;
      }
      
      const configPath = require('path').join(__dirname, '../CONFIG.json');
      require('fs').writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      
      if (this.engine && this.engine.getBot()) {
        this.engine.getBot().end();
        setTimeout(() => {
          if (this.engine) {
            this.engine.start();
          }
        }, 2000);
      }
      
      res.json({ 
        success: true, 
        message: `Bot will reconnect to ${host}:${port}`,
        config: { host, port, version }
      });
    });
    
    this.app.post('/api/auth/config', this._authenticate.bind(this), (req, res) => {
      const { type, username, password } = req.body;
      
      if (!username) {
        return res.json({ success: false, error: 'Username is required' });
      }
      
      this.config.auth.type = type || 'offline';
      this.config.auth.username = username;
      
      if (type === 'mojang' && password) {
        this.config.auth.password = password;
      } else {
        delete this.config.auth.password;
      }
      
      const configPath = require('path').join(__dirname, '../CONFIG.json');
      require('fs').writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      
      if (this.engine && this.engine.getBot()) {
        this.engine.getBot().end();
        setTimeout(() => {
          if (this.engine) {
            this.engine.start();
          }
        }, 2000);
      }
      
      res.json({ 
        success: true, 
        message: `Account settings updated. Bot will reconnect with ${type} auth.`
      });
    });
  }
  
  _authenticate(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    
    if (isLocalhost) {
      next();
      return;
    }
    
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (token === this.adminToken) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
  
  _setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('[Dashboard] Client connected:', socket.id);
      this.connectedClients.add(socket);
      
      const clientIP = socket.handshake.address;
      const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1' || clientIP.includes('127.0.0.1');
      
      socket.on('authenticate', (token) => {
        if (isLocalhost || token === this.adminToken) {
          socket.authenticated = true;
          socket.emit('authenticated', { success: true });
          this._sendInitialData(socket);
        } else {
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      });
      
      socket.on('start_bot', () => {
        if (!socket.authenticated) return;
        if (this.engine && !this.engine.running) {
          this.engine.start();
          this.broadcast('bot_status', { running: true });
        }
      });
      
      socket.on('stop_bot', () => {
        if (!socket.authenticated) return;
        if (this.engine && this.engine.running) {
          this.engine.stop();
          this.broadcast('bot_status', { running: false });
        }
      });
      
      socket.on('switch_mode', (data) => {
        if (!socket.authenticated) return;
        if (this.engine && this.engine.running) {
          const bot = this.engine.getBot();
          if (bot && bot.entity) {
            this.engine.switchMode(data.mode);
            this.broadcast('mode_changed', { mode: data.mode });
          } else {
            socket.emit('error', { message: 'Bot must be connected to server to switch modes' });
          }
        }
      });
      
      socket.on('send_chat', (data) => {
        if (!socket.authenticated) return;
        if (this.engine && this.engine.getBot()) {
          this.engine.getBot().chat(data.message);
          this.broadcast('chat_sent', { message: data.message });
        }
      });
      
      socket.on('execute_command', (data) => {
        if (!socket.authenticated) return;
        this._handleCommand(data.command, socket);
      });
      
      socket.on('add_task', (data) => {
        if (!socket.authenticated) return;
        if (this.engine) {
          const taskId = this.engine.getTaskManager().addTask(data.task);
          socket.emit('task_added', { taskId });
        }
      });
      
      socket.on('cancel_task', (data) => {
        if (!socket.authenticated) return;
        if (this.engine) {
          const success = this.engine.getTaskManager().cancelTask(data.taskId);
          socket.emit('task_cancelled', { taskId: data.taskId, success });
        }
      });
      
      socket.on('get_activities', (data) => {
        if (!socket.authenticated) return;
        if (this.engine) {
          const activities = this.engine.getActivityTracker().getActivities(data);
          socket.emit('activities_update', { activities });
        }
      });
      
      socket.on('get_goals', () => {
        if (!socket.authenticated) return;
        if (this.engine) {
          const playerAddon = this.engine.addons.get('player');
          if (playerAddon && playerAddon.progression) {
            socket.emit('goals_update', { goals: playerAddon.progression.getProgress() });
          }
        }
      });
      
      socket.on('add_goal', (data) => {
        if (!socket.authenticated) return;
        if (this.engine) {
          const playerAddon = this.engine.addons.get('player');
          if (playerAddon && playerAddon.progression) {
            if (!playerAddon.progression.goals[data.category]) {
              playerAddon.progression.goals[data.category] = {};
            }
            
            playerAddon.progression.goals[data.category][data.goalName] = {
              target: parseInt(data.target) || 10,
              current: 0,
              priority: parseInt(data.priority) || 3
            };
            
            playerAddon.progression._saveProgress();
            socket.emit('goal_added', { success: true });
            this.broadcast('goals_update', { goals: playerAddon.progression.getProgress() });
          }
        }
      });
      
      socket.on('send_command', (data) => {
        if (!socket.authenticated) return;
        this._handleCommand(data.command, socket);
      });
      
      socket.on('toggle_setting', (data) => {
        if (!socket.authenticated) return;
        if (this.engine) {
          const config = this.engine.config;
          const setting = data.setting;
          
          if (setting === 'autoEat') {
            config.autoEat.enabled = !config.autoEat.enabled;
            socket.emit('setting_toggled', { setting, value: config.autoEat.enabled });
          } else if (setting === 'autoDefend') {
            config.autoDefend.enabled = !config.autoDefend.enabled;
            socket.emit('setting_toggled', { setting, value: config.autoDefend.enabled });
          } else if (setting === 'autoReconnect') {
            config.autoReconnect.enabled = !config.autoReconnect.enabled;
            socket.emit('setting_toggled', { setting, value: config.autoReconnect.enabled });
          } else if (setting === 'healthAlerts') {
            config.healthAlerts = !config.healthAlerts;
            socket.emit('setting_toggled', { setting, value: config.healthAlerts });
          }
        }
      });
      
      socket.on('get_inventory', () => {
        if (!socket.authenticated) return;
        if (this.engine && this.engine.getBot()) {
          const bot = this.engine.getBot();
          const inventory = bot.inventory ? bot.inventory.slots.filter(slot => slot !== null).map(slot => ({
            name: slot.name,
            displayName: slot.displayName,
            count: slot.count,
            slot: slot.slot
          })) : [];
          socket.emit('inventory_update', { inventory });
        }
      });
      
      socket.on('disconnect', () => {
        console.log('[Dashboard] Client disconnected:', socket.id);
        this.connectedClients.delete(socket);
      });
    });
  }
  
  _sendInitialData(socket) {
    if (this.engine) {
      socket.emit('status_update', this.engine.getStatus());
    }
  }
  
  _handleCommand(command, socket) {
    if (!this.engine) return;
    
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    switch (cmd) {
      case 'mode':
        if (args[0]) {
          this.engine.switchMode(args[0]);
          socket.emit('command_result', { success: true, message: `Switched to ${args[0]} mode` });
        }
        break;
        
      case 'say':
        if (this.engine.getBot()) {
          this.engine.getBot().chat(args.join(' '));
          socket.emit('command_result', { success: true, message: 'Message sent' });
        }
        break;
        
      case 'status':
        socket.emit('command_result', { success: true, data: this.engine.getStatus() });
        break;
        
      default:
        socket.emit('command_result', { success: false, error: 'Unknown command' });
    }
  }
  
  broadcast(event, data) {
    this.io.emit(event, data);
  }
  
  setEngine(engine) {
    this.engine = engine;
    
    if (engine) {
      engine.on('bot_ready', () => {
        this.broadcast('bot_status', { running: true, ready: true });
      });
      
      engine.on('mode_changed', (data) => {
        this.broadcast('mode_changed', data);
      });
      
      engine.on('chat_message', (data) => {
        this.broadcast('chat_message', data);
      });
      
      setInterval(() => {
        if (engine.running) {
          this.broadcast('status_update', engine.getStatus());
        }
      }, 5000);
      
      setInterval(() => {
        if (engine.running) {
          const activities = engine.getActivityTracker().getActivities({ limit: 10 });
          this.broadcast('recent_activities', { activities });
        }
      }, 10000);
    }
  }
  
  start() {
    return new Promise((resolve) => {
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`[Dashboard] Server running on http://0.0.0.0:${this.port}`);
        console.log(`[Dashboard] Admin token: ${this.adminToken}`);
        resolve();
      });
    });
  }
  
  stop() {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('[Dashboard] Server stopped');
        resolve();
      });
    });
  }
}

if (require.main === module) {
  const configPath = process.argv[2] || '../CONFIG.json';
  
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const BotEngine = require('../src/engine');
  
  const engine = new BotEngine(config);
  
  const AFKAddon = require('../addons/afk');
  const PlayerAddon = require('../addons/player');
  const CraftingAddon = require('../addons/crafting');
  const PathfindingAddon = require('../addons/pathfinding');
  const MiningAddon = require('../addons/mining');
  const BuildingAddon = require('../addons/building');
  const TradingAddon = require('../addons/trading');
  
  engine.registerAddon(AFKAddon);
  engine.registerAddon(PlayerAddon);
  engine.registerAddon(CraftingAddon);
  engine.registerAddon(PathfindingAddon);
  engine.registerAddon(MiningAddon);
  engine.registerAddon(BuildingAddon);
  engine.registerAddon(TradingAddon);
  
  const dashboard = new DashboardServer(config, engine);
  dashboard.start().then(() => {
    engine.start();
  });
}

module.exports = DashboardServer;
