const BotIntelligence = require('./bot_intelligence');
const CivilizationDatabase = require('../db/database');
const WebSocketBroker = require('./websocket_broker');
const fs = require('fs');
const path = require('path');

class BotManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    this.db = new CivilizationDatabase(config.dbPath);
    this.wsBroker = new WebSocketBroker(config.wsPort || 8080, logger);
    
    this.bots = new Map();
    this.personalities = this._loadPersonalities();
    
    this.isRunning = false;
    this.civilizationUpdateInterval = null;
  }
  
  _loadPersonalities() {
    const personalities = new Map();
    const personalitiesDir = path.join(__dirname, '../personalities');
    
    const files = fs.readdirSync(personalitiesDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const personalityData = JSON.parse(
          fs.readFileSync(path.join(personalitiesDir, file), 'utf8')
        );
        const name = file.replace('.json', '');
        personalities.set(name, personalityData);
      }
    }
    
    this.logger.info(`[Manager] Loaded ${personalities.size} personality templates`);
    return personalities;
  }
  
  async start() {
    this.logger.info('[Manager] Starting Civilization System...');
    
    this.wsBroker.start();
    
    const botsToSpawn = this.config.bots || [];
    
    for (const botConfig of botsToSpawn) {
      await this.spawnBot(botConfig);
      await this._delay(3000);
    }
    
    this.civilizationUpdateInterval = setInterval(() => {
      this._updateCivilization();
    }, 300000);
    
    this.isRunning = true;
    this.logger.info('[Manager] Civilization System started');
  }
  
  async spawnBot(botConfig) {
    const botId = botConfig.id || `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const botName = botConfig.name || `Bot_${this.bots.size + 1}`;
    
    let personality;
    if (botConfig.personalityType && this.personalities.has(botConfig.personalityType)) {
      personality = this.personalities.get(botConfig.personalityType);
    } else {
      const personalityKeys = Array.from(this.personalities.keys());
      const randomKey = personalityKeys[Math.floor(Math.random() * personalityKeys.length)];
      personality = this.personalities.get(randomKey);
    }
    
    const fullConfig = {
      id: botId,
      name: botName,
      host: this.config.minecraftHost || 'localhost',
      port: this.config.minecraftPort || 25565,
      version: this.config.minecraftVersion || '1.20.1',
      personality: personality
    };
    
    const bot = new BotIntelligence(fullConfig, this.db, this.logger, this.wsBroker);
    
    const connected = await bot.connect();
    
    if (connected) {
      this.bots.set(botId, bot);
      this.logger.info(`[Manager] Bot ${botName} spawned successfully (${this.bots.size} total)`);
      return botId;
    } else {
      this.logger.error(`[Manager] Failed to spawn bot ${botName}`);
      return null;
    }
  }
  
  async removeBot(botId) {
    const bot = this.bots.get(botId);
    
    if (bot) {
      bot.disconnect();
      this.bots.delete(botId);
      this.wsBroker.unregisterBot(botId);
      
      this.logger.info(`[Manager] Bot ${botId} removed`);
      return true;
    }
    
    return false;
  }
  
  _updateCivilization() {
    const allBots = this.db.getAllBots();
    const villages = this.db.getAllVillages();
    
    this.logger.info(`[Civilization] Update - ${allBots.length} bots, ${villages.length} villages`);
    
    for (const village of villages) {
      const members = this.db.getVillageMembers(village.id);
      
      if (members.length === 0) {
        this.logger.info(`[Civilization] Village ${village.name} is abandoned`);
        this.db.logEvent('village_abandoned', `Village ${village.name} has been abandoned`, null, village.id);
      }
    }
    
    this._checkForNaturalVillageFormation();
  }
  
  _checkForNaturalVillageFormation() {
    const allBots = this.db.getAllBots();
    
    const clusters = this._findBotClusters(allBots);
    
    for (const cluster of clusters) {
      if (cluster.bots.length >= 3) {
        const existingVillage = this._isClusterInVillage(cluster);
        
        if (!existingVillage) {
          const strongRelationships = this._checkClusterRelationships(cluster.bots);
          
          if (strongRelationships >= 2) {
            this.logger.info(`[Civilization] Natural village formation detected at cluster`);
          }
        }
      }
    }
  }
  
  _findBotClusters(bots, clusterRadius = 75) {
    const clusters = [];
    const processed = new Set();
    
    for (const bot of bots) {
      if (processed.has(bot.id) || !bot.position_x) continue;
      
      const clusterBots = [bot];
      processed.add(bot.id);
      
      for (const otherBot of bots) {
        if (processed.has(otherBot.id) || !otherBot.position_x) continue;
        
        const distance = Math.sqrt(
          Math.pow(bot.position_x - otherBot.position_x, 2) +
          Math.pow(bot.position_z - otherBot.position_z, 2)
        );
        
        if (distance <= clusterRadius) {
          clusterBots.push(otherBot);
          processed.add(otherBot.id);
        }
      }
      
      if (clusterBots.length > 1) {
        const centerX = clusterBots.reduce((sum, b) => sum + b.position_x, 0) / clusterBots.length;
        const centerZ = clusterBots.reduce((sum, b) => sum + b.position_z, 0) / clusterBots.length;
        
        clusters.push({
          center: { x: centerX, z: centerZ },
          bots: clusterBots
        });
      }
    }
    
    return clusters;
  }
  
  _isClusterInVillage(cluster) {
    const villages = this.db.getAllVillages();
    
    for (const village of villages) {
      const distance = Math.sqrt(
        Math.pow(village.center_x - cluster.center.x, 2) +
        Math.pow(village.center_z - cluster.center.z, 2)
      );
      
      if (distance < village.radius) {
        return village;
      }
    }
    
    return null;
  }
  
  _checkClusterRelationships(bots) {
    let strongRelationships = 0;
    
    for (let i = 0; i < bots.length; i++) {
      for (let j = i + 1; j < bots.length; j++) {
        const rel = this.db.getRelationship(bots[i].id, bots[j].id);
        if (rel && rel.affinity >= 0.6) {
          strongRelationships++;
        }
      }
    }
    
    return strongRelationships;
  }
  
  getAllBotsStatus() {
    const status = [];
    
    for (const [botId, bot] of this.bots.entries()) {
      status.push(bot.getStatus());
    }
    
    return status;
  }
  
  getCivilizationStatus() {
    const allBots = this.db.getAllBots();
    const villages = this.db.getAllVillages();
    const recentEvents = this.db.getRecentEvents(50);
    
    return {
      totalBots: allBots.length,
      activeBots: this.bots.size,
      villages: villages.length,
      recentEvents: recentEvents,
      uptime: process.uptime()
    };
  }
  
  async backup() {
    const backupDir = path.join(__dirname, '../../data/civilization/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(backupDir, `civilization_${timestamp}.db`);
    
    await this.db.backup(backupPath);
    
    this.logger.info(`[Manager] Database backed up to ${backupPath}`);
    return backupPath;
  }
  
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async stop() {
    this.logger.info('[Manager] Stopping Civilization System...');
    
    if (this.civilizationUpdateInterval) {
      clearInterval(this.civilizationUpdateInterval);
    }
    
    for (const [botId, bot] of this.bots.entries()) {
      bot.disconnect();
    }
    
    this.bots.clear();
    
    this.wsBroker.stop();
    
    await this.backup();
    
    this.db.close();
    
    this.isRunning = false;
    this.logger.info('[Manager] Civilization System stopped');
  }
}

module.exports = BotManager;
