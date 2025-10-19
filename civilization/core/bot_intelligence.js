const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const DecisionEngine = require('./decision_engine');
const MemorySystem = require('./memory_system');
const SocialSystem = require('./social_system');
const ActionExecutor = require('./action_executor');

class BotIntelligence {
  constructor(botConfig, db, logger, wsBroker) {
    this.config = botConfig;
    this.db = db;
    this.logger = logger;
    this.wsBroker = wsBroker;
    
    this.bot = null;
    this.botId = botConfig.id;
    this.botName = botConfig.name;
    
    this.decisionEngine = new DecisionEngine(db, logger);
    this.memorySystem = new MemorySystem(db, logger);
    this.socialSystem = new SocialSystem(db, logger, this.memorySystem);
    this.actionExecutor = null;
    
    this.personality = null;
    this.currentEmotions = null;
    this.currentGoal = null;
    this.actionInterval = null;
    this.emotionUpdateInterval = null;
    
    this.isPerformingAction = false;
    this.lastActionTime = 0;
    this.actionCooldown = 15000;
  }
  
  async connect() {
    try {
      this.logger.info(`[Bot ${this.botName}] Connecting to server...`);
      
      this.bot = mineflayer.createBot({
        host: this.config.host || 'localhost',
        port: this.config.port || 25565,
        username: this.botName,
        version: this.config.version || '1.20.1',
        auth: 'offline'
      });
      
      this.bot.loadPlugin(pathfinder);
      this._setupEventHandlers();
      
      await new Promise((resolve, reject) => {
        this.bot.once('spawn', resolve);
        this.bot.once('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 30000);
      });
      
      this.logger.info(`[Bot ${this.botName}] Connected and spawned`);
      
      // Setup pathfinder AFTER spawn
      const mcData = require('minecraft-data')(this.bot.version);
      const defaultMove = new Movements(this.bot, mcData);
      this.bot.pathfinder.setMovements(defaultMove);
      
      this.actionExecutor = new ActionExecutor(this.bot, this.logger);
      
      await this._initialize();
      
      return true;
    } catch (error) {
      this.logger.error(`[Bot ${this.botName}] Connection failed:`, error.message);
      return false;
    }
  }
  
  async _initialize() {
    let botData = this.db.getBot(this.botId);
    
    if (!botData) {
      this.db.createBot({
        id: this.botId,
        name: this.botName,
        username: this.botName,
        x: this.bot.entity.position.x,
        y: this.bot.entity.position.y,
        z: this.bot.entity.position.z
      });
      
      this.db.setPersonality(this.botId, this.config.personality.traits);
      
      this.db.addEmotion(this.botId, {
        hunger: 0.3,
        safety: 0.7,
        loneliness: 0.5,
        boredom: 0.4,
        curiosity: this.config.personality.traits.curiosity,
        satisfaction: 0.5,
        stress: 0.2
      });
      
      this.memorySystem.recordAchievement(
        this.botId,
        'awakening',
        'First consciousness in the digital world'
      );
      
      this.logger.info(`[Bot ${this.botName}] New bot initialized in database`);
    }
    
    this.personality = this.db.getPersonality(this.botId);
    this.currentEmotions = this.db.getLatestEmotions(this.botId);
    
    this._registerWithBroker();
    
    this.actionInterval = setInterval(() => this._performAutonomousAction(), this.actionCooldown);
    this.emotionUpdateInterval = setInterval(() => this._updateEmotions(), 60000);
    
    setTimeout(() => this._performAutonomousAction(), 5000);
  }
  
  _setupEventHandlers() {
    this.bot.on('chat', (username, message) => {
      if (username === this.bot.username) return;
      
      this._handleIncomingChat(username, message);
    });
    
    this.bot.on('playerJoined', (player) => {
      this._handlePlayerJoined(player);
    });
    
    this.bot.on('entityHurt', (entity) => {
      if (entity === this.bot.entity) {
        this._handleDamage();
      }
    });
    
    this.bot.on('death', () => {
      this._handleDeath();
    });
    
    this.bot.on('health', () => {
      this._updateHealthStatus();
    });
    
    this.bot.on('error', (err) => {
      this.logger.error(`[Bot ${this.botName}] Error:`, err.message);
    });
  }
  
  async _performAutonomousAction() {
    if (this.isPerformingAction) return;
    if (!this.bot || !this.bot.entity) return;
    
    const now = Date.now();
    if (now - this.lastActionTime < this.actionCooldown) return;
    
    this.isPerformingAction = true;
    this.lastActionTime = now;
    
    try {
      const context = this._gatherContext();
      
      this.currentEmotions = this.db.getLatestEmotions(this.botId);
      
      const decision = this.decisionEngine.selectAction(
        this.botId,
        this.personality,
        this.currentEmotions,
        context
      );
      
      await this._executeAction(decision);
      
      this._updatePosition();
      
    } catch (error) {
      this.logger.error(`[Bot ${this.botName}] Action error:`, error.message);
    } finally {
      this.isPerformingAction = false;
    }
  }
  
  _gatherContext() {
    const nearbyPlayers = Object.values(this.bot.players).filter(p => 
      p.entity && p.username !== this.bot.username
    );
    
    const nearbyBots = this.db.getAllBots().filter(b => {
      if (!b.position_x || b.id === this.botId) return false;
      const dist = Math.sqrt(
        Math.pow(b.position_x - this.bot.entity.position.x, 2) +
        Math.pow(b.position_z - this.bot.entity.position.z, 2)
      );
      return dist < 50;
    });
    
    return {
      health: this.bot.health,
      food: this.bot.food,
      time: this._getTimeOfDay(),
      nearby_bots: nearbyBots.length,
      nearbyBots: nearbyBots.map(b => b.id),
      currentLocation: {
        x: this.bot.entity.position.x,
        y: this.bot.entity.position.y,
        z: this.bot.entity.position.z
      },
      has_resources: this._hasBasicResources(),
      resources_nearby: this._detectNearbyResources(),
      inventory_space: this._getInventorySpace(),
      in_village: this._isInVillage(),
      safety: this._evaluateSafety()
    };
  }
  
  async _executeAction(decision) {
    this.logger.info(`[Bot ${this.botName}] Executing: ${decision.action}`);
    
    let result = 'success';
    let actionResult = null;
    const params = decision.params || {};
    
    try {
      // Use action params from decision engine if available
      const executionCategory = params.category || decision.action;
      
      switch(decision.action) {
        // Building actions - use specific structure types
        case 'build_house':
        case 'build_farm':
        case 'build_workshop':
        case 'build_storage':
        case 'build_road':
        case 'build_bridge':
          actionResult = await this.actionExecutor.executeAction('build_structure', { 
            type: params.type,
            skipMaterialCheck: false 
          });
          break;
        
        // Gathering actions - use specific amounts
        case 'gather_wood':
          actionResult = await this.actionExecutor.executeAction('gather_wood', { amount: params.amount || 16 });
          break;
        
        case 'gather_stone':
          actionResult = await this.actionExecutor.executeAction('gather_stone', { amount: params.amount || 32 });
          break;
        
        case 'mine_ore':
          actionResult = await this.actionExecutor.executeAction('mine_ore', { oreType: params.oreType || 'iron_ore' });
          break;
        
        case 'hunt_food':
          actionResult = await this.actionExecutor.executeAction('hunt_food');
          break;
        
        // Exploration actions
        case 'explore_new_area':
        case 'map_terrain':
        case 'find_resources':
          actionResult = await this.actionExecutor.executeAction('explore', { distance: params.distance || 40 });
          break;
        
        // Social actions
        case 'greet_bot':
        case 'chat':
        case 'help_other':
          actionResult = await this.actionExecutor.executeAction('socialize', { targetPlayer: params.target });
          break;
        
        case 'trade':
        case 'offer_trade':
          actionResult = await this.actionExecutor.executeAction('trade', params);
          break;
        
        // Survival actions
        case 'eat':
          await this._tryEat();
          actionResult = { success: true };
          break;
        
        case 'flee':
        case 'seek_shelter':
          await this._seekSafety();
          actionResult = { success: true };
          break;
        
        // Resting actions
        case 'idle':
        case 'rest':
        case 'sleep':
        case 'organize_inventory':
          actionResult = await this.actionExecutor.executeAction('rest', { duration: 5000 });
          break;
        
        // Crafting actions
        case 'craft_items':
          actionResult = await this.actionExecutor.executeAction('craft_item', { item: params.item || 'crafting_table' });
          break;
        
        // Fallback - explore
        default:
          this.logger.warn(`[Bot ${this.botName}] Unknown action: ${decision.action}, defaulting to explore`);
          actionResult = await this.actionExecutor.executeAction('explore', { distance: 20 });
      }
      
      if (actionResult && !actionResult.success) {
        result = 'failure';
        this.logger.info(`[Bot ${this.botName}] Action failed: ${actionResult.reason || 'unknown'}`);
      } else {
        this.logger.info(`[Bot ${this.botName}] Action completed successfully`);
      }
    } catch (error) {
      this.logger.warn(`[Bot ${this.botName}] Action execution failed: ${error.message}`);
      result = 'failure';
    }
    
    this.decisionEngine.updateEmotionsAfterAction(this.botId, decision.action, result);
  }
  
  _chooseResourceType() {
    const resources = ['gather_wood', 'gather_stone', 'mine_ore'];
    return resources[Math.floor(Math.random() * resources.length)];
  }
  
  async _explore() {
    const randomAngle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 30;
    
    const targetX = this.bot.entity.position.x + Math.cos(randomAngle) * distance;
    const targetZ = this.bot.entity.position.z + Math.sin(randomAngle) * distance;
    const targetY = this.bot.entity.position.y;
    
    await this._moveToPosition(targetX, targetY, targetZ);
    
    this.memorySystem.recordDiscovery(
      this.botId,
      'exploration',
      'Explored new area',
      { x: targetX, y: targetY, z: targetZ }
    );
  }
  
  async _socialInteract() {
    const context = this._gatherContext();
    
    if (context.nearbyBots.length === 0) {
      this.bot.chat(this._randomPhrase(['Anyone around?', 'Hello?', 'Hey there!']));
      return;
    }
    
    const targetBotId = context.nearbyBots[Math.floor(Math.random() * context.nearbyBots.length)];
    const interactionTypes = ['greeting', 'trade_offer', 'help_offer', 'share_discovery'];
    const interactionType = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
    
    const result = this.socialSystem.initiateInteraction(
      this.botId,
      targetBotId,
      interactionType,
      { location: context.currentLocation }
    );
    
    if (result && result.message) {
      this.bot.chat(result.message);
    }
  }
  
  async _buildSomething() {
    const hasWood = this.bot.inventory.items().some(item => item.name.includes('log'));
    
    if (!hasWood) {
      this.bot.chat('Need to gather some wood first...');
      return;
    }
    
    this.bot.chat(this._randomPhrase([
      'Working on my base',
      'Building something cool',
      'Time to build'
    ]));
    
    this.memorySystem.recordAchievement(this.botId, 'building', 'Started construction');
  }
  
  async _gatherResources() {
    const tree = this.bot.findBlock({
      matching: block => block.name.includes('log'),
      maxDistance: 32
    });
    
    if (tree) {
      await this._moveToPosition(tree.position.x, tree.position.y, tree.position.z);
      this.bot.chat('Gathering some resources');
    } else {
      await this._wander();
    }
  }
  
  async _tryEat() {
    const food = this.bot.inventory.items().find(item => 
      item.name.includes('bread') || item.name.includes('apple') || 
      item.name.includes('carrot') || item.name.includes('potato')
    );
    
    if (food) {
      await this.bot.equip(food, 'hand');
      await this.bot.consume();
    }
  }
  
  async _seekSafety() {
    const randomAngle = Math.random() * Math.PI * 2;
    const targetX = this.bot.entity.position.x + Math.cos(randomAngle) * 15;
    const targetZ = this.bot.entity.position.z + Math.sin(randomAngle) * 15;
    
    await this._moveToPosition(targetX, this.bot.entity.position.y, targetZ);
  }
  
  async _rest() {
    this.bot.chat(this._randomPhrase(['Taking a break', 'Resting a bit', 'afk']));
  }
  
  async _wander() {
    const randomAngle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 10;
    
    const targetX = this.bot.entity.position.x + Math.cos(randomAngle) * distance;
    const targetZ = this.bot.entity.position.z + Math.sin(randomAngle) * distance;
    
    await this._moveToPosition(targetX, this.bot.entity.position.y, targetZ);
  }
  
  async _moveToPosition(x, y, z) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const movements = new Movements(this.bot, mcData);
      this.bot.pathfinder.setMovements(movements);
      
      const goal = new goals.GoalNear(x, y, z, 1);
      await this.bot.pathfinder.goto(goal);
    } catch (error) {
    }
  }
  
  _handleIncomingChat(username, message) {
    if (!this.personality) return; // Not initialized yet
    const botRef = this.db.getBotByName(username);
    
    if (botRef) {
      this.socialSystem.initiateInteraction(
        this.botId,
        botRef.id,
        'greeting',
        {}
      );
    }
    
    if (Math.random() < 0.3) {
      setTimeout(() => {
        this.bot.chat(this._randomPhrase(['lol', 'nice', 'cool', 'interesting']));
      }, 2000 + Math.random() * 3000);
    }
  }
  
  _handlePlayerJoined(player) {
    if (!this.personality) return; // Not initialized yet
    if (Math.random() < this.personality.sociability) {
      setTimeout(() => {
        this.bot.chat(`Hey ${player.username}!`);
      }, 3000 + Math.random() * 5000);
    }
  }
  
  _handleDamage() {
    if (!this.personality) return; // Not initialized yet
    this.currentEmotions = this.db.getLatestEmotions(this.botId);
    this.currentEmotions.safety = Math.max(0, this.currentEmotions.safety - 0.3);
    this.currentEmotions.stress = Math.min(1, this.currentEmotions.stress + 0.4);
    this.db.addEmotion(this.botId, this.currentEmotions);
    
    this._seekSafety();
  }
  
  _handleDeath() {
    if (!this.personality) return; // Not initialized yet
    setTimeout(() => {
      this.bot.respawn();
      
      this.memorySystem.recordEmotionalEvent(
        this.botId,
        'fear',
        0.9,
        'death'
      );
    }, 2000);
  }
  
  _updateHealthStatus() {
    if (!this.personality) return; // Not initialized yet
    this.db.updateBotStats(
      this.botId,
      this.bot.health,
      this.bot.food,
      this.bot.experience.level,
      this.bot.experience.points
    );
  }
  
  _updatePosition() {
    if (this.bot && this.bot.entity) {
      this.db.updateBotPosition(
        this.botId,
        this.bot.entity.position.x,
        this.bot.entity.position.y,
        this.bot.entity.position.z
      );
    }
  }
  
  _updateEmotions() {
    if (!this.currentEmotions) return;
    
    this.currentEmotions.hunger = Math.min(1, (20 - this.bot.food) / 20);
    this.currentEmotions.safety = Math.min(1, this.bot.health / 20);
    this.currentEmotions.loneliness = Math.min(1, this.currentEmotions.loneliness + 0.05);
    this.currentEmotions.boredom = Math.min(1, this.currentEmotions.boredom + 0.03);
    
    this.db.addEmotion(this.botId, this.currentEmotions);
  }
  
  _getTimeOfDay() {
    if (!this.bot.time) return 'day';
    const time = this.bot.time.timeOfDay;
    return (time < 12000 || time > 23000) ? 'day' : 'night';
  }
  
  _hasBasicResources() {
    return this.bot.inventory.items().length > 5;
  }
  
  _detectNearbyResources() {
    const blocks = this.bot.findBlocks({
      matching: block => block.name.includes('log') || block.name.includes('ore'),
      maxDistance: 16,
      count: 5
    });
    return blocks.length > 0;
  }
  
  _getInventorySpace() {
    const totalSlots = 36;
    const usedSlots = this.bot.inventory.items().length;
    return 1 - (usedSlots / totalSlots);
  }
  
  _isInVillage() {
    const villages = this.db.getAllVillages();
    for (const village of villages) {
      const dist = Math.sqrt(
        Math.pow(village.center_x - this.bot.entity.position.x, 2) +
        Math.pow(village.center_z - this.bot.entity.position.z, 2)
      );
      if (dist < village.radius) return true;
    }
    return false;
  }
  
  _evaluateSafety() {
    const hostileMobs = Object.values(this.bot.entities).filter(entity =>
      entity.type === 'mob' && entity.mobType && 
      ['zombie', 'skeleton', 'creeper', 'spider'].includes(entity.mobType)
    );
    
    return hostileMobs.length === 0 ? 0.9 : 0.3;
  }
  
  _registerWithBroker() {
    if (this.wsBroker) {
      this.wsBroker.registerBot(this.botId, this);
    }
  }
  
  _randomPhrase(phrases) {
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  
  getStatus() {
    if (!this.bot || !this.bot.entity) {
      return { status: 'offline' };
    }
    
    return {
      status: 'online',
      name: this.botName,
      position: this.bot.entity.position,
      health: this.bot.health,
      food: this.bot.food,
      emotions: this.currentEmotions,
      personality: this.personality,
      currentGoal: this.currentGoal
    };
  }
  
  disconnect() {
    if (this.actionInterval) clearInterval(this.actionInterval);
    if (this.emotionUpdateInterval) clearInterval(this.emotionUpdateInterval);
    
    if (this.bot) {
      this.bot.quit();
    }
    
    this.logger.info(`[Bot ${this.botName}] Disconnected`);
  }
}

module.exports = BotIntelligence;
