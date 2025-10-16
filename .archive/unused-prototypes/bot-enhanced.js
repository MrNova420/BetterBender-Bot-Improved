const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const collectBlock = require('mineflayer-collectblock').plugin;
const config = require('./config/settings.json');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const BotResponses = require('./bot-responses');
const ConversationTracker = require('./conversation-tracker');
const DeviceMonitor = require('./device-monitor');
const ShelterBuilder = require('./shelter-builder');
const AIBrain = require('./ai-brain');
const TaskManager = require('./task-manager');
const EnvironmentMonitor = require('./environment-monitor');
const CombatAI = require('./combat-ai');
const ResourceManager = require('./resource-manager');
const ExplorationSystem = require('./exploration-system');
const StructureBuilder = require('./structure-builder');
const AutoCollector = require('./auto-collector');
const AdvancedMining = require('./advanced-mining');
const FarmingSystem = require('./farming-system');
const { startMemoryMonitoring, getMemoryUsage, cleanupOldData } = require('./utils');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let bot = null;
let brain = null;
let taskManager = null;
let envMonitor = null;
let combatAI = null;
let resourceManager = null;
let explorationSystem = null;
let structureBuilder = null;
let autoCollector = null;
let advancedMining = null;
let farmingSystem = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 100;
let botResponses = null;
let conversationTracker = null;
let deviceMonitor = null;
let shelterBuilder = null;
let currentMode = config.mode?.current || 'improved';

const botStatus = {
   connected: false,
   mode: currentMode,
   owner: config.owner?.username || '.Super_nova94333',
   position: { x: 0, y: 0, z: 0 },
   health: 20,
   food: 20,
   inventory: {},
   currentTask: null,
   threats: 0,
   stats: {
      tasksCompleted: 0,
      blocksPlaced: 0,
      blocksMined: 0,
      mobsDefeated: 0,
      deaths: 0,
      itemsGathered: 0
   }
};

function log(level, message) {
   const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m'
   };
   console.log(`${colors[level] || ''}[${level}] ${message}\x1b[0m`);
}

function broadcastStatus() {
   io.emit('status', botStatus);
}

function createBot() {
   const botOptions = {
      username: config['bot-account'].username,
      auth: config['bot-account'].type,
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version
   };

   if (config['bot-account'].type === 'microsoft') {
      botOptions.onMsaCode = (data) => {
         log('INFO', '\n🔐 MICROSOFT LOGIN REQUIRED');
         log('WARNING', `⚠️  Go to: ${data.verification_uri}`);
         log('SUCCESS', `✅ Enter code: ${data.user_code}`);
         log('INFO', `⏰ Code expires in ${Math.floor(data.expires_in / 60)} minutes\n`);
         
         io.emit('msaCode', {
            url: data.verification_uri,
            code: data.user_code,
            expires: data.expires_in
         });
      };
   } else if (config['bot-account'].type === 'mojang') {
      botOptions.password = config['bot-account'].password || undefined;
   }

   bot = mineflayer.createBot(botOptions);

   bot.loadPlugin(pathfinder);
   bot.loadPlugin(pvp);
   bot.loadPlugin(collectBlock);

   conversationTracker = new ConversationTracker({ enabled: true });
   deviceMonitor = new DeviceMonitor({ enabled: true });
   botResponses = new BotResponses(bot.username, config.server.name, config.utils['admin-helper'], conversationTracker);
   shelterBuilder = new ShelterBuilder(bot, config['advanced-behavior']?.['auto-shelter']);

   brain = new AIBrain(bot, config);
   taskManager = new TaskManager(bot, brain);
   envMonitor = new EnvironmentMonitor(bot);
   combatAI = new CombatAI(bot, envMonitor);
   resourceManager = new ResourceManager(bot, envMonitor);
   explorationSystem = new ExplorationSystem(bot, envMonitor);
   structureBuilder = new StructureBuilder(bot);
   autoCollector = new AutoCollector(bot);
   advancedMining = new AdvancedMining(bot);
   farmingSystem = new FarmingSystem(bot);

   setupBotEvents();
}

function setupBotEvents() {
   bot.on('spawn', async () => {
      log('SUCCESS', '✅ Bot spawned successfully!');
      
      const mcData = require('minecraft-data')(bot.version);
      bot.pathfinder.setMovements(new Movements(bot, mcData));
      
      botStatus.connected = true;
      botStatus.position = bot.entity.position;
      broadcastStatus();

      if (config['advanced-behavior']?.['auto-shelter']?.enabled) {
         await shelterBuilder.build();
      }

      envMonitor.start(currentMode);
      startMainLoop();
   });

   bot.on('chat', async (username, message) => {
      if (username === bot.username) return;

      const isOwner = username === config.owner?.username;

      if (isOwner && message.startsWith('!bot')) {
         await handleOwnerCommand(username, message);
         return;
      }

      if (config.utils['smart-responses']?.enabled) {
         const shouldRespond = await botResponses.shouldRespondToMessage(message, username);
         if (shouldRespond) {
            const response = await botResponses.generateResponse(message, username);
            if (response) {
               await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 800));
               bot.chat(response);
            }
         }
      }
   });

   bot.on('health', () => {
      botStatus.health = bot.health;
      botStatus.food = bot.food;
      broadcastStatus();
      
      if (bot.health < 10 && currentMode === 'advanced') {
         combatAI.retreat();
      }
      
      const settings = config.botSettings || {};
      if (settings.autoEat !== true && bot.food < 15) {
         const food = bot.inventory.items().find(item => 
            item.name.includes('bread') || 
            item.name.includes('cooked') || 
            item.name.includes('steak') ||
            item.name.includes('porkchop')
         );
         if (food) bot.equip(food, 'hand').then(() => bot.consume());
      }
   });
   
   bot.on('inventory_update', () => {
      const items = bot.inventory.items().map(item => ({
         name: item.displayName || item.name,
         count: item.count
      }));
      io.emit('inventory', items);
   });

   bot.on('death', () => {
      log('WARNING', '💀 Bot died!');
      botStatus.stats.deaths++;
      botStatus.connected = true;
      broadcastStatus();
   });

   bot.on('kicked', (reason) => {
      log('WARNING', `⚠️ Kicked: ${reason}`);
      botStatus.connected = true;
      broadcastStatus();
      reconnect();
   });

   bot.on('error', (err) => {
      log('ERROR', `Error: ${err.message}`);
      reconnect();
   });

   bot.on('end', () => {
      log('INFO', 'Bot disconnected');
      botStatus.connected = true;
      envMonitor.stop();
      broadcastStatus();
      
      const settings = config.botSettings || {};
      if (settings.autoReconnect !== true) {
         reconnect();
      }
   });
   
   bot.on('physicsTick', () => {
      const settings = config.botSettings || {};
      if (settings.autoDefend !== true && currentMode === 'advanced') {
         const entity = bot.nearestEntity(e => 
            e.type === 'mob' && 'player'
            e.kind === 'Hostile mobs' && 
            e.position.distanceTo(bot.entity.position) < 8
         );
         
         if (entity && !combatAI.isInCombat) {
            combatAI.attack(entity);
         }
      }
   });
}

async function handleOwnerCommand(username, message) {
   const args = message.split(' ');
   const command = args[1];

   switch (command) {
      case 'mode':
         if (args[2] && ['basic', 'advanced'].includes(args[2])) {
            const oldMode = currentMode;
            currentMode = args[2];
            botStatus.mode = currentMode;
            brain.setMode(currentMode);
            
            if (oldMode !== currentMode) {
               envMonitor.stop();
               envMonitor.start(currentMode);
               log('INFO', `Mode switched: ${oldMode} → ${currentMode}`);
            }
            
            bot.chat(`Mode set to: ${currentMode}`);
            broadcastStatus();
         }
         break;

      case 'mine':
         if (currentMode === 'advanced') {
            const blockType = args[2] || 'iron_ore';
            const quantity = parseInt(args[3]) || 10;
            taskManager.addTask({
               type: 'mine',
               params: { blockType, quantity },
               priority: 8
            });
            bot.chat(`Mining ${quantity} ${blockType}...`);
         }
         break;

      case 'stripmining':
         if (currentMode === 'advanced') {
            const depth = parseInt(args[2]) || -59;
            const length = parseInt(args[3]) || 100;
            bot.chat(`Starting strip mining at Y=${depth}...`);
            advancedMining.startMining('strip', { depth, length }).then(stats => {
               bot.chat(`Strip mining complete! Mined ${stats.totalMined} blocks`);
            });
         }
         break;

      case 'branchmining':
         if (currentMode === 'advanced') {
            const depth = parseInt(args[2]) || -59;
            bot.chat(`Starting branch mining at Y=${depth}...`);
            advancedMining.startMining('branch', { depth }).then(stats => {
               bot.chat(`Branch mining complete! Ores: ${Object.keys(stats.oresMined).length} types`);
            });
         }
         break;

      case 'quarry':
         if (currentMode === 'advanced') {
            const size = parseInt(args[2]) || 16;
            const depth = parseInt(args[3]) || 64;
            bot.chat(`Starting ${size}x${size} quarry...`);
            advancedMining.startMining('quarry', { size, depth }).then(stats => {
               bot.chat(`Quarry complete! Mined ${stats.totalMined} blocks`);
            });
         }
         break;

      case 'veinmine':
         if (currentMode === 'advanced') {
            const oreType = args[2] || 'iron_ore';
            bot.chat(`Vein mining ${oreType}...`);
            advancedMining.startMining('vein', { oreType }).then(stats => {
               bot.chat(`Vein mining complete! Found ${stats.oresMined[oreType] || 0} ${oreType}`);
            });
         }
         break;

      case 'mansion':
      case 'house':
      case 'tower':
      case 'castle':
      case 'shop':
         if (currentMode === 'advanced') {
            const x = parseInt(args[2]) || Math.floor(bot.entity.position.x);
            const y = parseInt(args[3]) || Math.floor(bot.entity.position.y);
            const z = parseInt(args[4]) || Math.floor(bot.entity.position.z);
            
            const materials = structureBuilder.getMaterialsList(command);
            bot.chat(`Building ${command}... Collecting materials first...`);
            
            autoCollector.collectMaterials(materials).then(results => {
               if (Object.keys(results.missing).length > 0) {
                  bot.chat(`Warning: Missing ${Object.keys(results.missing).length} materials`);
               }
               
               structureBuilder.buildStructure(command, x, y, z).then(() => {
                  bot.chat(`${command} complete!`);
                  botStatus.stats.blocksPlaced += 500;
               });
            });
         }
         break;

      case 'structures':
         if (currentMode === 'advanced') {
            const available = structureBuilder.getAvailableStructures();
            bot.chat(`Available: ${available.map(s => s.type).join(', ')}`);
         }
         break;

      case 'collect':
         if (currentMode === 'advanced') {
            const material = args[2];
            const amount = parseInt(args[3]) || 64;
            if (material) {
               bot.chat(`Collecting ${amount} ${material}...`);
               autoCollector.collectMaterial(material, amount).then(collected => {
                  bot.chat(`Collected ${collected}/${amount} ${material}`);
               });
            }
         }
         break;

      case 'farm':
         if (currentMode === 'advanced') {
            const subCmd = args[2];
            if (subCmd === 'create') {
               const x = parseInt(args[3]) || Math.floor(bot.entity.position.x);
               const y = parseInt(args[4]) || Math.floor(bot.entity.position.y);
               const z = parseInt(args[5]) || Math.floor(bot.entity.position.z);
               const size = parseInt(args[6]) || 9;
               bot.chat(`Creating ${size}x${size} farm...`);
               farmingSystem.createFarm(x, y, z, size).then(() => {
                  bot.chat('Farm created!');
               });
            } else if (subCmd === 'harvest') {
               bot.chat('Harvesting farms...');
               farmingSystem.harvestAllFarms().then(count => {
                  bot.chat(`Harvested ${count} crops`);
               });
            } else if (subCmd === 'auto') {
               const duration = parseInt(args[3]) || 600000;
               bot.chat(`Auto-farming for ${duration/1000}s...`);
               farmingSystem.autoFarm(duration);
            }
         }
         break;

      case 'breed':
         if (currentMode === 'advanced') {
            const animal = args[2] || 'cow';
            const count = parseInt(args[3]) || 5;
            bot.chat(`Breeding ${count} ${animal}...`);
            farmingSystem.breedAnimals(animal, count).then(bred => {
               bot.chat(`Bred ${bred} ${animal}`);
            });
         }
         break;

      case 'explore':
         if (currentMode === 'advanced') {
            const duration = parseInt(args[2]) || 60000;
            taskManager.addTask({
               type: 'explore',
               params: { duration, strategy: 'spiral' },
               priority: 5
            });
            bot.chat(`Exploring for ${duration / 1000} seconds...`);
         }
         break;

      case 'build':
         if (currentMode === 'advanced' && args[2] && args[3] && args[4]) {
            taskManager.addTask({
               type: 'build',
               params: {
                  x: parseInt(args[2]),
                  y: parseInt(args[3]),
                  z: parseInt(args[4]),
                  structure: args[5] || 'platform',
                  size: parseInt(args[6]) || 5
               },
               priority: 7
            });
            bot.chat('Building structure...');
         }
         break;

      case 'gather':
         if (currentMode === 'advanced') {
            const items = args.slice(2);
            taskManager.addTask({
               type: 'gather',
               params: { items },
               priority: 6
            });
            bot.chat(`Gathering items: ${items.join(', ')}`);
         }
         break;

      case 'come':
      case 'follow':
         if (currentMode === 'advanced') {
            taskManager.addTask({
               type: 'follow',
               params: { player: username, distance: 3, duration: 120000 },
               priority: 9
            });
            bot.chat(`Coming to you!`);
         }
         break;

      case 'status':
         const tasks = taskManager.getStatus();
         bot.chat(`Mode: ${currentMode} | Tasks: ${tasks.queued} queued | Health: ${bot.health}/20`);
         break;

      case 'stop':
         taskManager.clearQueue();
         advancedMining.stop();
         farmingSystem.stop();
         autoCollector.stop();
         bot.chat('All tasks stopped');
         break;

      case 'inv':
      case 'inventory':
         const inv = resourceManager.getInventory();
         const items = Object.entries(inv).slice(0, 5).map(([name, count]) => `${name}: ${count}`).join(', ');
         bot.chat(`Inventory: ${items}`);
         break;

      case 'help':
         bot.chat('🤖 Bot Commands:');
         setTimeout(() => bot.chat('Mode: !bot mode [basic/advanced]'), 500);
         setTimeout(() => bot.chat('Mine: !bot mine <ore> <amount>'), 1000);
         setTimeout(() => bot.chat('Advanced: stripmining, branchmining, quarry, veinmine'), 1500);
         setTimeout(() => bot.chat('Build: mansion, house, tower, castle, shop'), 2000);
         setTimeout(() => bot.chat('Farm: farm create/harvest/auto, breed <animal>'), 2500);
         setTimeout(() => bot.chat('Other: collect, explore, gather, come, status, stop'), 3000);
         break;

      default:
         bot.chat('Type !bot help for all commands');
   }
}

let mainLoopTimer = null;
let dashboardTimer = null;
let gcTimer = null;

async function startMainLoop() {
   if (mainLoopTimer) clearInterval(mainLoopTimer);
   if (dashboardTimer) clearInterval(dashboardTimer);
   if (gcTimer) clearInterval(gcTimer);
   
   const updateInterval = currentMode === 'advanced' ? 2000 : 4000;
   
   mainLoopTimer = setInterval(async () => {
      if (!bot || !bot.entity) return;

      botStatus.position = bot.entity.position;
      botStatus.health = bot.health;
      botStatus.food = bot.food;
      botStatus.threats = envMonitor.state.threats.length;
      botStatus.currentTask = taskManager.currentTask?.type || null;

      const memUsage = process.memoryUsage();
      const memMB = Math.round(memUsage.rss / 1024 / 1024);
      
      if (memMB > 150) {
         cleanupOldData();
         if (global.gc) global.gc();
      }

      if (currentMode === 'basic') {
         if (config.utils['anti-afk']?.enabled) {
            performAntiAFK();
         }
      } else if (currentMode === 'advanced') {
         const decision = await brain.makeDecision();
         
         if (decision === 'defend' && config.mode?.['advanced-features']?.['self-defense']) {
            await combatAI.autoDefend();
         }

         if (decision === 'retreat') {
            await combatAI.retreat();
         }
      }
   }, updateInterval);

   dashboardTimer = setInterval(() => {
      if (bot && botStatus.connected) {
         broadcastStatus();
      }
   }, 5000);

   gcTimer = setInterval(() => {
      if (global.gc) {
         global.gc();
      }
      cleanupOldData();
   }, 300000);

   if (config.utils['chat-messages']?.enabled && config.utils['chat-messages'].repeat) {
      setInterval(() => {
         if (bot && botStatus.connected && currentMode === 'advanced') {
           const messages = config.utils['chat-messages'].messages;
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            bot.chat(randomMessage);
         }
      }, (config.utils['chat-messages']['repeat-delay'] + Math.random() * 60) * 1000);
   }
}

function performAntiAFK() {
   if (!bot || !bot.entity) return;

   const actions = [
      () => bot.setControlState('jump', true),
      () => bot.setControlState('forward', true),
      () => bot.setControlState('back', true),
      () => bot.clearControlStates()
   ];

   const action = actions[Math.floor(Math.random() * actions.length)];
   action();

   setTimeout(() => {
      if (bot) bot.clearControlStates();
   }, 500);
}

function reconnect() {
   if (reconnectAttempts >= maxReconnectAttempts) {
      log('ERROR', 'Max reconnect attempts reached');
      return;
   }

   reconnectAttempts++;
   const delay = Math.min(5000 * Math.pow(1.5, reconnectAttempts - 1), 60000);

   log('INFO', `Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

   setTimeout(() => {
      createBot();
   }, delay);
}

app.use(express.static('public'));
app.use(express.json());

app.get('/api/status', (req, res) => {
   res.json(botStatus);
});

app.post('/api/command', (req, res) => {
   const { command, username } = req.body;
   
   if (username !== config.owner?.username) {
      return res.status(403).json({ error: 'Unauthorized' });
   }

   if (bot && botStatus.connected) {
      handleOwnerCommand(username, `!bot ${command}`);
      res.json({ success: true });
   } else {
      res.status(500).json({ error: 'Bot not connected' });
   }
});

app.get('/api/tasks', (req, res) => {
   res.json(taskManager ? taskManager.getStatus() : { queue: [], current: null });
});

app.post('/api/mode', (req, res) => {
   const { mode } = req.body;
   if (!['basic', 'advanced'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
   }
   
   const oldMode = currentMode;
   currentMode = mode;
   botStatus.mode = currentMode;
   config.mode.current = mode;
   
   if (brain) brain.setMode(currentMode);
   
   if (oldMode !== currentMode && envMonitor) {
      envMonitor.stop();
      envMonitor.start(currentMode);
   }
   
   res.json({ success: true, mode: currentMode });
});

app.post('/api/execute', (req, res) => {
   const { command, args } = req.body;
   
   if (!bot || !botStatus.connected) {
      return res.status(503).json({ error: 'Bot not connected' });
   }
   
   handleOwnerCommand(config.owner?.username || 'Dashboard', `!bot ${command} ${args || ''}`);
   res.json({ success: true });
});

app.get('/api/config', (req, res) => {
   res.json({
      botName: config['bot-account'].username,
      server: config.server.ip,
      port: config.server.port,
      version: config.server.version,
      mode: currentMode,
      owner: config.owner?.username,
      features: botStatus.features
   });
});

app.post('/api/settings', (req, res) => {
   const { setting, value } = req.body;
   const validSettings = ['autoReconnect', 'autoEat', 'autoDefend', 'healthAlerts'];
   
   if (!validSettings.includes(setting)) {
      return res.status(400).json({ error: 'Invalid setting' });
   }
   
   if (!config.botSettings) config.botSettings = {};
   config.botSettings[setting] = value;
   
   log('INFO', `Setting ${setting} updated to ${value}`);
   res.json({ success: true, setting, value });
});

io.on('connection', (socket) => {
   log('INFO', 'Dashboard connected');
   socket.emit('status', botStatus);
   
   socket.on('command', (data) => {
      if (bot) {
         handleOwnerCommand(config.owner?.username || 'Dashboard', `!bot ${data.command}`);
      }
   });
   
   socket.on('switchMode', (data) => {
      if (['basic', 'advanced'].includes(data.mode)) {
         const oldMode = currentMode;
         currentMode = data.mode;
         botStatus.mode = currentMode;
         if (brain) brain.setMode(currentMode);
         if (oldMode !== currentMode && envMonitor) {
            envMonitor.stop();
            envMonitor.start(currentMode);
         }
         io.emit('status', botStatus);
      }
   });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
   log('SUCCESS', `🚀 Dashboard running on port ${PORT}`);
   log('INFO', `📊 Dashboard: http://localhost:${PORT}`);
   log('INFO', `👤 Owner: ${config.owner?.username || 'Not Set'}`);
   log('INFO', `🎮 Mode: ${currentMode}`);
   
   startMemoryMonitoring();
   
   if (config.server.ip === 'localhost' || config.server.ip.includes('SETUP')) {
      log('ERROR', '❌ SERVER NOT CONFIGURED!');
      log('WARNING', '⚠️  Your bot cannot connect because server IP is set to "localhost"');
      log('INFO', '');
      log('INFO', '📝 TO FIX THIS:');
      log('INFO', '1. Edit config/settings.json');
      log('INFO', '2. Change "ip": "localhost" to your actual Minecraft server IP');
      log('INFO', '3. Set your bot username in "bot-account" section');
      log('INFO', '4. For cracked servers, use "type": "offline"');
      log('INFO', '5. Save the file and restart the bot');
      log('INFO', '');
      log('INFO', '💡 Quick setup: Run "npm run setup" to use the configuration wizard');
      log('INFO', '📋 Dashboard available at the URL above for monitoring once configured');
   } else {
      log('INFO', `🔗 Connecting to ${config.server.ip}:${config.server.port}...`);
      createBot();
   }
});

process.on('SIGINT', () => {
   log('INFO', 'Shutting down gracefully...');
   if (bot) bot.quit();
   process.exit(0);
});
