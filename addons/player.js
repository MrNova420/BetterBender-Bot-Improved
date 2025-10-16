class EnhancedPlayerAddon {
  constructor() {
    this.name = 'player';
    this.bot = null;
    this.engine = null;
    this.logger = null;
    this.enabled = false;
    
    this.states = ['work', 'rest', 'trade', 'social', 'explore', 'build', 'organize'];
    this.currentState = 'rest';
    this.stateStartTime = 0;
    this.stateInterval = null;
    this.activityInterval = null;
    this.config = {};
    
    this.blocksThisCycle = 0;
    this.lastActionTime = 0;
    this.recentPlayers = new Map();
    this.inventory = [];
    this.isWorking = false;
    
    this.naturalPhrases = {
      greetings: ['Hey!', 'Hi there', 'Hello!', 'Yo', 'Sup', 'Hey everyone', 'Greetings'],
      responses: ['lol', 'nice', 'cool', 'awesome', 'thanks', 'ty', 'np', 'yeah', 'sure', 'ok'],
      questions: ['Anyone need help?', 'What are you building?', 'Need any materials?', 'Found anything cool?'],
      observations: ['This area looks nice', 'Cool builds here', 'Lots of resources nearby', 'Nice spot'],
      work: ['Working on my base', 'Gathering some materials', 'Mining for a bit', 'Organizing my stuff'],
      leaving: ['Gonna explore a bit', 'brb', 'back later', 'afk for a min'],
      mistakes: ['oops', 'whoops', 'my bad', 'lol fail']
    };
    
    this.chatCooldown = 0;
    this.lastChatTime = 0;
  }
  
  init(bot, engine) {
    this.bot = bot;
    this.engine = engine;
    this.logger = engine.getLogger();
    this.config = engine.config.playerMode || {};
    
    const ProgressionSystem = require('../src/core/progressionSystem');
    const PlayerInteractions = require('./player-interactions');
    const AutonomousGoalGenerator = require('../src/core/autonomousGoals');
    const HomeBuilder = require('../src/core/homeBuilder');
    
    this.progression = new ProgressionSystem(engine.getStateManager(), this.logger);
    this.interactions = new PlayerInteractions(bot, engine, this.logger);
    this.autonomousGoals = new AutonomousGoalGenerator(bot, this.logger, this.progression);
    this.homeBuilder = new HomeBuilder(bot, this.logger);
    
    this._setupEventHandlers();
    
    if (engine.currentMode === 'player') {
      this.enable();
    }
  }
  
  _setupEventHandlers() {
    this.bot.on('playerJoined', (player) => {
      if (this.enabled && this.config.respondToChat) {
        this._handlePlayerJoin(player);
      }
    });
    
    this.bot.on('playerLeft', (player) => {
      this.recentPlayers.delete(player.username);
    });
    
    this.bot.on('death', () => {
      if (this.enabled) {
        this._handleDeath();
      }
    });
    
    this.bot.on('messagestr', (message, messagePosition, jsonMsg, sender) => {
      if (this.enabled && this.config.respondToChat) {
        this._handleChatMessage(message, sender);
      }
    });
    
    this.bot.on('health', () => {
      if (this.enabled) {
        this._handleHealthChange();
      }
    });
    
    this.bot.on('entityHurt', (entity) => {
      if (this.enabled && entity === this.bot.entity) {
        this._reactToHurt();
      }
    });
  }
  
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.logger.info('[Enhanced Player] Mode activated');
    
    this._setState('rest');
    
    this.stateInterval = setInterval(() => {
      this._updateState();
    }, 5000);
    
    this.activityInterval = setInterval(() => {
      this._performActivity();
    }, 3000 + Math.random() * 2000);
    
    setTimeout(() => {
      this._naturalGreeting();
    }, 5000 + Math.random() * 10000);
  }
  
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.logger.info('[Enhanced Player] Mode deactivated');
    
    if (this.stateInterval) {
      clearInterval(this.stateInterval);
      this.stateInterval = null;
    }
    
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
    
    this.bot.clearControlStates();
  }
  
  _naturalGreeting() {
    if (!this.enabled || Math.random() > 0.6) return;
    
    const greeting = this._randomFrom(this.naturalPhrases.greetings);
    setTimeout(() => {
      this._saySomething(greeting);
    }, 2000 + Math.random() * 3000);
  }
  
  _handlePlayerJoin(player) {
    if (player.username === this.bot.username) return;
    
    this.recentPlayers.set(player.username, Date.now());
    
    if (Math.random() < 0.3) {
      setTimeout(() => {
        const greetings = ['Hey ' + player.username, 'Welcome back', 'Hi ' + player.username];
        this._saySomething(this._randomFrom(greetings));
      }, 3000 + Math.random() * 5000);
    }
  }
  
  _handleDeath() {
    const reactions = ['oof', 'rip', 'welp', 'lol', 'dang it'];
    this._saySomething(this._randomFrom(reactions));
    
    setTimeout(() => {
      this.bot.respawn();
      this._setState('rest');
    }, 2000 + Math.random() * 3000);
  }
  
  _reactToHurt() {
    if (Math.random() < 0.2 && this.bot.health > 5) {
      const reactions = ['ow', 'hey!', 'stop', 'ouch'];
      this._saySomething(this._randomFrom(reactions));
    }
  }
  
  _handleHealthChange() {
    if (this.bot.food < 16) {
      this._tryEat();
    }
    
    if (this.bot.health < 10 && this.currentState !== 'rest') {
      this._setState('rest');
    }
  }
  
  _handleChatMessage(message, sender) {
    if (!message || !this.enabled) return;
    
    const now = Date.now();
    if (now - this.lastChatTime < this.chatCooldown) return;
    
    const lowerMsg = message.toLowerCase();
    const botName = this.bot.username.toLowerCase();
    
    const mentionsBot = lowerMsg.includes(botName);
    const isQuestion = lowerMsg.includes('?') || lowerMsg.includes('anyone') || lowerMsg.includes('help');
    const shouldRespond = mentionsBot || (isQuestion && Math.random() < 0.4);
    
    let playerName = 'unknown';
    if (sender && typeof sender === 'string') {
      playerName = sender;
    }
    
    if (mentionsBot && playerName !== 'unknown') {
      this.engine.getStateManager().updatePlayerRelationship(playerName, 'mentioned_bot');
      
      const response = this.interactions.handlePlayerRequest(playerName, message);
      if (response) {
        setTimeout(() => {
          this._saySomething(response);
        }, 1500 + Math.random() * 2500);
        return;
      }
    }
    
    if (shouldRespond) {
      const delay = 1500 + Math.random() * 3000;
      
      setTimeout(() => {
        if (lowerMsg.includes('help')) {
          const helps = ['Sure, what do you need?', 'Happy to help!', 'What can I do?', 'Yeah, what\'s up?'];
          this._saySomething(this._randomFrom(helps));
        } else if (lowerMsg.includes('doing') || lowerMsg.includes('up')) {
          const currentGoal = this.progression.getCurrentGoal();
          if (currentGoal) {
            const goalResponses = [
              `Working on ${currentGoal.name}`,
              `Trying to ${currentGoal.name}`,
              'Just gathering resources',
              'Building stuff'
            ];
            this._saySomething(this._randomFrom(goalResponses));
          } else {
            this._saySomething(this._randomFrom(this.naturalPhrases.work));
          }
        } else if (lowerMsg.includes('building')) {
          const responses = ['Working on my base', 'Just gathering stuff', 'Exploring mostly', 'Nothing much'];
          this._saySomething(this._randomFrom(responses));
        } else {
          this._saySomething(this._randomFrom(this.naturalPhrases.responses));
        }
      }, delay);
    } else if (Math.random() < 0.05) {
      setTimeout(() => {
        this._saySomething(this._randomFrom(this.naturalPhrases.responses));
      }, 2000 + Math.random() * 4000);
    }
  }
  
  _saySomething(message) {
    const now = Date.now();
    if (now - this.lastChatTime < 10000) return;
    
    try {
      this.bot.chat(message);
      this.lastChatTime = now;
      this.chatCooldown = 15000 + Math.random() * 15000;
      this.logger.debug(`[Enhanced Player] Said: ${message}`);
    } catch (err) {
      this.logger.debug('[Enhanced Player] Chat error:', err.message);
    }
  }
  
  _setState(newState) {
    if (this.currentState === newState) return;
    
    this.logger.info(`[Enhanced Player] State: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
    this.stateStartTime = Date.now();
    this.blocksThisCycle = 0;
  }
  
  _updateState() {
    if (!this.bot || !this.bot.entity) return;
    
    if (this.engine.getSafety().isThrottled()) {
      if (this.currentState !== 'rest') {
        this._setState('rest');
      }
      return;
    }
    
    const elapsed = Date.now() - this.stateStartTime;
    const maxBlocks = this.config.maxBlocksPerCycle || 100;
    
    if (this.blocksThisCycle >= maxBlocks) {
      this._setState('rest');
      return;
    }
    
    const stateDurations = {
      work: 1800000,
      rest: 300000,
      trade: 600000,
      social: 900000,
      explore: 1200000,
      build: 1500000,
      organize: 400000
    };
    
    const duration = stateDurations[this.currentState] || 600000;
    
    if (elapsed > duration) {
      const nextState = this._pickNextState();
      this._setState(nextState);
      
      if (Math.random() < 0.2) {
        setTimeout(() => {
          const phrases = this.naturalPhrases[nextState] || this.naturalPhrases.work;
          this._saySomething(this._randomFrom(phrases));
        }, 2000 + Math.random() * 3000);
      }
    }
  }
  
  _pickNextState() {
    const weights = {
      rest: 0.15,
      work: 0.25,
      explore: 0.20,
      social: 0.15,
      build: 0.15,
      organize: 0.05,
      trade: 0.05
    };
    
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [state, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand < cumulative) {
        return state;
      }
    }
    
    return 'work';
  }
  
  _performActivity() {
    if (!this.bot || !this.bot.entity || !this.enabled) return;
    
    const now = Date.now();
    if (now - this.lastActionTime < 2000) return;
    
    if (this.interactions.hasActiveTasks()) {
      this._handlePlayerTask();
      this.lastActionTime = now;
      return;
    }
    
    switch (this.currentState) {
      case 'work':
        this._doWork();
        break;
      case 'rest':
        this._doRest();
        break;
      case 'explore':
        this._doExplore();
        break;
      case 'social':
        this._doSocial();
        break;
      case 'build':
        this._doBuild();
        break;
      case 'organize':
        this._doOrganize();
        break;
    }
    
    this.lastActionTime = now;
  }
  
  _handlePlayerTask() {
    const task = this.interactions.getNextHelpTask();
    if (!task) return;
    
    this.logger.info(`[Player] Helping ${task.player} with ${task.type}`);
    
    switch (task.type) {
      case 'follow':
        this._followPlayer(task.player);
        break;
      case 'gather':
        this._gatherForPlayer(task.resourceType);
        break;
      case 'build':
        this._buildForPlayer(task.buildType);
        break;
    }
  }
  
  _followPlayer(playerName) {
    const player = this.bot.players[playerName];
    if (player && player.entity) {
      const pos = player.entity.position;
      this.bot.lookAt(pos);
      
      const distance = this.bot.entity.position.distanceTo(pos);
      if (distance > 3) {
        this.bot.setControlState('forward', true);
        if (distance > 10) this.bot.setControlState('sprint', true);
        
        setTimeout(() => {
          this.bot.clearControlStates();
        }, 2000);
      }
    }
  }
  
  _gatherForPlayer(resourceType) {
    this._gatherNaturally();
    this.progression.updateGoal('social', 'helpPlayers', 1);
  }
  
  _buildForPlayer(buildType) {
    this._placeBlockNaturally();
    this.progression.updateGoal('social', 'helpPlayers', 1);
  }
  
  async _doWork() {
    if (this.isWorking) return;
    this.isWorking = true;
    
    try {
      const autonomousGoal = this.autonomousGoals.getNextGoal();
      
      if (autonomousGoal) {
        this.logger.info(`[Player] Working on: ${autonomousGoal.description}`);
        
        switch (autonomousGoal.action) {
          case 'establish_home':
            this._gatherNaturally();
            const homePos = this.bot.entity.position;
            if (homePos) {
              this.autonomousGoals.setHomeLocation(homePos);
              this.autonomousGoals.completeGoal('establish_home');
            }
            break;
            
          case 'build_storage':
            this._placeBlockNaturally();
            setTimeout(() => {
              this.autonomousGoals.completeGoal('build_storage');
            }, 60000);
            break;
            
          case 'expand_base':
            this._placeBlockNaturally();
            setTimeout(() => {
              this.autonomousGoals.completeGoal('expand_base');
            }, 120000);
            break;
          
        case 'gather_basic_materials':
          this._gatherNaturally();
          break;
          
        case 'craft_tools':
          this._checkInventory();
          break;
          
        case 'find_food':
          this._gatherNaturally();
          break;
          
        case 'interact_with_players':
          this._doSocial();
          break;
          
        case 'explore_new_areas':
        case 'explore_randomly':
          this._walkNaturally();
          break;
          
        case 'find_trading_opportunities':
          this._doTrade();
          break;
          
        default:
          this._mineNaturally();
        }
      } else {
        const currentGoal = this.progression.getCurrentGoal();
        
        if (currentGoal) {
          if (currentGoal.name.includes('mine') || currentGoal.name.includes('Mine')) {
            this._mineNaturally();
          } else if (currentGoal.name.includes('gather') || currentGoal.name.includes('Gather')) {
            this._gatherNaturally();
          } else if (currentGoal.name.includes('build') || currentGoal.name.includes('Build')) {
            this._placeBlockNaturally();
          } else {
            this._mineNaturally();
          }
        } else {
          this._mineNaturally();
        }
      }
    } finally {
      this.isWorking = false;
    }
  }
  
  _doRest() {
    if (Math.random() < 0.3) {
      this._lookAround();
    }
    
    if (Math.random() < 0.1) {
      this._checkInventory();
    }
  }
  
  _doExplore() {
    if (Math.random() < 0.7) {
      this._walkNaturally();
    } else {
      this._lookAround();
    }
  }
  
  _doSocial() {
    if (Math.random() < 0.1) {
      const phrases = [...this.naturalPhrases.questions, ...this.naturalPhrases.observations];
      this._saySomething(this._randomFrom(phrases));
    } else {
      this._lookAround();
    }
  }
  
  _doBuild() {
    if (Math.random() < 0.4) {
      this._placeBlockNaturally();
    } else {
      this._lookAround();
    }
  }
  
  _doOrganize() {
    this._checkInventory();
  }
  
  _mineNaturally() {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const blocks = ['stone', 'dirt', 'coal_ore', 'iron_ore', 'oak_log', 'birch_log'];
      
      for (const blockName of blocks) {
        const blockType = mcData.blocksByName[blockName];
        if (!blockType) continue;
        
        const block = this.bot.findBlock({
          matching: blockType.id,
          maxDistance: 16 + Math.random() * 16
        });
        
        if (block) {
          const tool = this._getBestTool(block);
          
          if (tool) {
            this.bot.equip(tool, 'hand', (err) => {
              if (err) return;
              
              this.bot.lookAt(block.position.offset(0.5, 0.5, 0.5));
              
              setTimeout(() => {
                this.bot.dig(block, (err) => {
                  if (!err) {
                    this.blocksThisCycle++;
                    this.engine.getSafety().recordBlock();
                    
                    if (blockName.includes('coal')) {
                      this.progression.updateGoal('resources', 'mineCoal', 1);
                    } else if (blockName.includes('iron')) {
                      this.progression.updateGoal('resources', 'mineIron', 1);
                    } else if (blockName.includes('stone')) {
                      this.progression.updateGoal('resources', 'mineStone', 1);
                    }
                    
                    if (Math.random() < 0.05) {
                      setTimeout(() => {
                        const comments = ['nice', 'got it', 'cool'];
                        this._saySomething(this._randomFrom(comments));
                      }, 500 + Math.random() * 1000);
                    }
                  }
                });
              }, 300 + Math.random() * 700);
            });
          }
          break;
        }
      }
    } catch (err) {
      this.logger.debug('[Enhanced Player] Mining error:', err.message);
    }
  }
  
  _gatherNaturally() {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const gatherables = ['wheat', 'carrots', 'potatoes', 'oak_log', 'birch_log'];
      
      for (const itemName of gatherables) {
        const itemType = mcData.blocksByName[itemName];
        if (!itemType) continue;
        
        const block = this.bot.findBlock({
          matching: itemType.id,
          maxDistance: 12 + Math.random() * 12
        });
        
        if (block) {
          this.bot.lookAt(block.position.offset(0.5, 0.5, 0.5));
          
          setTimeout(() => {
            this.bot.dig(block, (err) => {
              if (!err) {
                this.blocksThisCycle++;
                this.engine.getSafety().recordBlock();
                
                if (itemName.includes('log')) {
                  this.progression.updateGoal('survival', 'gatherWood', 1);
                } else if (itemName.includes('wheat') || itemName.includes('carrot') || itemName.includes('potato')) {
                  this.progression.updateGoal('survival', 'gatherFood', 1);
                }
              }
            });
          }, 400 + Math.random() * 600);
          break;
        }
      }
    } catch (err) {
      this.logger.debug('[Enhanced Player] Gathering error:', err.message);
    }
  }
  
  _placeBlockNaturally() {
    try {
      const buildableItems = this.bot.inventory.items().filter(item => {
        return item && item.name && (
          item.name.includes('planks') ||
          item.name.includes('stone') ||
          item.name.includes('cobblestone') ||
          item.name.includes('dirt')
        );
      });
      
      if (buildableItems.length > 0) {
        const item = this._randomFrom(buildableItems);
        const pos = this.bot.entity.position;
        const offsetX = Math.floor(Math.random() * 5 - 2);
        const offsetZ = Math.floor(Math.random() * 5 - 2);
        
        const referenceBlock = this.bot.blockAt(
          pos.offset(offsetX, -1, offsetZ)
        );
        
        if (referenceBlock && referenceBlock.name !== 'air') {
          this.bot.equip(item, 'hand', (err) => {
            if (err) return;
            
            this.bot.lookAt(referenceBlock.position.offset(0.5, 1, 0.5));
            
            setTimeout(() => {
              const Vec3 = require('vec3');
              this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0), (err) => {
                if (!err) {
                  this.blocksThisCycle++;
                  this.engine.getSafety().recordBlock();
                }
              });
            }, 300 + Math.random() * 700);
          });
        }
      }
    } catch (err) {
      this.logger.debug('[Enhanced Player] Building error:', err.message);
    }
  }
  
  _walkNaturally() {
    try {
      const pos = this.bot.entity.position;
      const distance = 10 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      
      const dx = Math.cos(angle) * distance;
      const dz = Math.sin(angle) * distance;
      
      const targetPos = pos.offset(dx, 0, dz);
      this.bot.lookAt(targetPos);
      
      this.bot.setControlState('forward', true);
      
      if (Math.random() < 0.3) {
        this.bot.setControlState('sprint', true);
      }
      
      const walkTime = 2000 + Math.random() * 3000;
      
      setTimeout(() => {
        this.bot.clearControlStates();
      }, walkTime);
      
      if (Math.random() < 0.2) {
        setTimeout(() => {
          this.bot.setControlState('jump', true);
          setTimeout(() => {
            this.bot.setControlState('jump', false);
          }, 200);
        }, walkTime / 2);
      }
    } catch (err) {
      this.logger.debug('[Enhanced Player] Walking error:', err.message);
    }
  }
  
  _lookAround() {
    try {
      const yaw = this.bot.entity.yaw + (Math.random() - 0.5) * Math.PI;
      const pitch = (Math.random() - 0.5) * 0.5;
      
      this.bot.look(yaw, pitch, false);
    } catch (err) {
      this.logger.debug('[Enhanced Player] Look error:', err.message);
    }
  }
  
  _checkInventory() {
    if (Math.random() < 0.3) {
      const slot = Math.floor(Math.random() * 9);
      this.bot.setQuickBarSlot(slot);
    }
  }
  
  _getBestTool(block) {
    const tools = this.bot.inventory.items().filter(item => {
      return item && item.name && (
        item.name.includes('pickaxe') ||
        item.name.includes('shovel') ||
        item.name.includes('axe')
      );
    });
    
    if (tools.length === 0) return null;
    
    return this._randomFrom(tools);
  }
  
  _tryEat() {
    try {
      const foods = this.bot.inventory.items().filter(item => {
        return item && item.name && (
          item.name.includes('bread') ||
          item.name.includes('beef') ||
          item.name.includes('pork') ||
          item.name.includes('chicken') ||
          item.name.includes('fish') ||
          item.name.includes('apple') ||
          item.name.includes('carrot') ||
          item.name.includes('potato') ||
          item.name.includes('mutton')
        );
      });
      
      if (foods.length > 0) {
        this.bot.equip(foods[0], 'hand', (err) => {
          if (!err) {
            this.bot.consume((err) => {
              if (!err) {
                this.logger.info('[Enhanced Player] Ate food');
              }
            });
          }
        });
      }
    } catch (err) {
      this.logger.debug('[Enhanced Player] Eat error:', err.message);
    }
  }
  
  _randomFrom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  cleanup() {
    this.disable();
  }
}

module.exports = new EnhancedPlayerAddon();
