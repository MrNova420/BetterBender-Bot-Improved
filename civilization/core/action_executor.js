const { goals: Goals } = require('mineflayer-pathfinder');
const BuildingSystem = require('./building_system');
const MaterialGatherer = require('./material_gatherer');

class ActionExecutor {
  constructor(bot, logger) {
    this.bot = bot;
    this.logger = logger;
    this.isExecuting = false;
    this.currentAction = null;
    this.buildingSystem = new BuildingSystem(bot, logger);
    this.materialGatherer = new MaterialGatherer(bot, logger, this);
    this.autoGatherMaterials = true; // Enable automatic material gathering
  }

  async executeAction(actionType, params = {}) {
    if (this.isExecuting) {
      this.logger.warn(`[${this.bot.username}] Already executing action, skipping`);
      return { success: false, reason: 'busy' };
    }

    this.isExecuting = true;
    this.currentAction = actionType;
    
    try {
      let result;
      
      switch (actionType) {
        case 'gather_wood':
          result = await this._gatherWood(params.amount || 10);
          break;
        case 'gather_stone':
          result = await this._gatherStone(params.amount || 10);
          break;
        case 'mine_ore':
          result = await this._mineOre(params.oreType || 'iron_ore');
          break;
        case 'hunt_food':
          result = await this._huntFood();
          break;
        case 'explore':
          result = await this._explore(params.distance || 50);
          break;
        case 'build_structure':
          result = await this._buildStructure(params);
          break;
        case 'craft_item':
          result = await this._craftItem(params.item);
          break;
        case 'socialize':
          result = await this._socialize(params.targetPlayer);
          break;
        case 'trade':
          result = await this._trade(params);
          break;
        case 'defend':
          result = await this._defend();
          break;
        case 'rest':
          result = await this._rest(params.duration || 10000);
          break;
        default:
          this.logger.warn(`[${this.bot.username}] Unknown action: ${actionType}`);
          result = { success: false, reason: 'unknown_action' };
      }
      
      return result;
    } catch (error) {
      this.logger.error(`[${this.bot.username}] Action ${actionType} failed:`, error.message);
      return { success: false, reason: error.message };
    } finally {
      this.isExecuting = false;
      this.currentAction = null;
    }
  }

  async _gatherWood(amount) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const logBlock = mcData.blocksByName['oak_log'] || mcData.blocksByName['log'];
      
      if (!logBlock) {
        return { success: false, reason: 'no_wood_type' };
      }

      let gathered = 0;
      const maxAttempts = 5;
      
      for (let i = 0; i < maxAttempts && gathered < amount; i++) {
        const block = this.bot.findBlock({
          matching: logBlock.id,
          maxDistance: 32
        });

        if (!block) {
          this.logger.info(`[${this.bot.username}] No wood found nearby`);
          break;
        }

        await this._equipBestTool(block);
        
        const goal = new Goals.GoalBlock(block.position.x, block.position.y, block.position.z);
        await this.bot.pathfinder.goto(goal);
        
        await this.bot.dig(block);
        gathered++;
        
        this.logger.info(`[${this.bot.username}] Gathered wood ${gathered}/${amount}`);
      }

      return { 
        success: gathered > 0, 
        amount: gathered,
        item: 'wood' 
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _gatherStone(amount) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const stoneBlock = mcData.blocksByName['stone'] || mcData.blocksByName['cobblestone'];
      
      if (!stoneBlock) {
        return { success: false, reason: 'no_stone_type' };
      }

      let gathered = 0;
      const maxAttempts = 5;
      
      for (let i = 0; i < maxAttempts && gathered < amount; i++) {
        const block = this.bot.findBlock({
          matching: stoneBlock.id,
          maxDistance: 32
        });

        if (!block) {
          this.logger.info(`[${this.bot.username}] No stone found nearby`);
          break;
        }

        await this._equipBestTool(block);
        
        const goal = new Goals.GoalBlock(block.position.x, block.position.y, block.position.z);
        await this.bot.pathfinder.goto(goal);
        
        await this.bot.dig(block);
        gathered++;
        
        this.logger.info(`[${this.bot.username}] Gathered stone ${gathered}/${amount}`);
      }

      return { 
        success: gathered > 0, 
        amount: gathered,
        item: 'stone' 
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _mineOre(oreType) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const oreBlock = mcData.blocksByName[oreType];
      
      if (!oreBlock) {
        return { success: false, reason: 'invalid_ore_type' };
      }

      const block = this.bot.findBlock({
        matching: oreBlock.id,
        maxDistance: 64
      });

      if (!block) {
        return { success: false, reason: 'no_ore_found' };
      }

      await this._equipBestTool(block);
      
      const goal = new Goals.GoalBlock(block.position.x, block.position.y, block.position.z);
      await this.bot.pathfinder.goto(goal);
      
      await this.bot.dig(block);
      
      this.logger.info(`[${this.bot.username}] Mined ${oreType}`);
      
      return { success: true, item: oreType };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _huntFood() {
    try {
      const animals = ['pig', 'cow', 'chicken', 'sheep'];
      let targetEntity = null;
      
      for (const animal of animals) {
        const entity = Object.values(this.bot.entities).find(e => 
          e.type === 'mob' && 
          e.name && 
          e.name.toLowerCase().includes(animal) &&
          e.position.distanceTo(this.bot.entity.position) < 32
        );
        
        if (entity) {
          targetEntity = entity;
          break;
        }
      }

      if (!targetEntity) {
        return { success: false, reason: 'no_animals_found' };
      }

      const weapon = this._getBestWeapon();
      if (weapon) {
        await this.bot.equip(weapon, 'hand');
      }

      const goal = new Goals.GoalFollow(targetEntity, 2);
      this.bot.pathfinder.setGoal(goal, true);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.bot.attack(targetEntity);
      
      this.logger.info(`[${this.bot.username}] Hunted for food`);
      
      return { success: true, action: 'hunted' };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _explore(distance) {
    try {
      const currentPos = this.bot.entity.position;
      const randomAngle = Math.random() * Math.PI * 2;
      const targetX = currentPos.x + Math.cos(randomAngle) * distance;
      const targetZ = currentPos.z + Math.sin(randomAngle) * distance;
      
      const goal = new Goals.GoalNear(targetX, currentPos.y, targetZ, 5);
      await this.bot.pathfinder.goto(goal);
      
      this.logger.info(`[${this.bot.username}] Explored new area`);
      
      return { success: true, distance };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _buildStructure(params) {
    try {
      const { type, position, skipMaterialCheck, autoGather } = params;
      
      if (!type) {
        return { success: false, reason: 'no_structure_type' };
      }
      
      // If no position specified, use current location with offset
      let buildLocation = position;
      if (!buildLocation) {
        const currentPos = this.bot.entity.position;
        buildLocation = {
          x: Math.floor(currentPos.x) + 5,
          y: Math.floor(currentPos.y),
          z: Math.floor(currentPos.z) + 5
        };
      }

      this.logger.info(`[${this.bot.username}] Planning to build ${type} at (${buildLocation.x}, ${buildLocation.y}, ${buildLocation.z})`);
      
      // Check if we need to gather materials first
      if (!skipMaterialCheck && (autoGather || this.autoGatherMaterials)) {
        const materials = this.buildingSystem.getMaterialsNeeded(type);
        if (materials) {
          const check = this.materialGatherer.checkMaterials(materials);
          
          if (!check.hasMaterials) {
            this.logger.info(`[${this.bot.username}] Missing materials, attempting to gather...`);
            this.logger.info(`[${this.bot.username}] Needed:`, check.missing);
            
            const gatherResult = await this.materialGatherer.gatherMaterials(materials, {
              maxAttempts: 2,
              timeout: 30000 // 30 seconds per material
            });
            
            if (gatherResult.success) {
              this.logger.info(`[${this.bot.username}] Successfully gathered all materials`);
            } else {
              this.logger.warn(`[${this.bot.username}] Could not gather all materials: ${JSON.stringify(gatherResult.stillMissing)}`);
              this.logger.info(`[${this.bot.username}] Attempting build anyway with available materials...`);
            }
          }
        }
      }
      
      // Use the building system to construct the structure
      const result = await this.buildingSystem.buildStructure(type, buildLocation, { 
        skipMaterialCheck: skipMaterialCheck || this.autoGatherMaterials 
      });
      
      if (result.success) {
        this.logger.info(`[${this.bot.username}] Successfully built ${type}`);
      } else {
        this.logger.warn(`[${this.bot.username}] Failed to build ${type}: ${result.reason}`);
        if (result.needed) {
          this.logger.info(`[${this.bot.username}] Still needed:`, result.needed);
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`[${this.bot.username}] Build structure error:`, error.message);
      return { success: false, reason: error.message };
    }
  }

  async _craftItem(itemName) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const item = mcData.itemsByName[itemName];
      
      if (!item) {
        return { success: false, reason: 'invalid_item' };
      }

      const recipe = this.bot.recipesFor(item.id, null, 1, null)[0];
      
      if (!recipe) {
        return { success: false, reason: 'no_recipe' };
      }

      await this.bot.craft(recipe, 1, null);
      
      this.logger.info(`[${this.bot.username}] Crafted ${itemName}`);
      
      return { success: true, item: itemName };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _socialize(targetPlayer) {
    try {
      const greetings = [
        `Hello ${targetPlayer || 'friend'}!`,
        `Greetings ${targetPlayer || 'traveler'}`,
        `Nice day, isn't it?`,
        `How are you doing?`
      ];
      
      const message = greetings[Math.floor(Math.random() * greetings.length)];
      this.bot.chat(message);
      
      this.logger.info(`[${this.bot.username}] Socialized: ${message}`);
      
      return { success: true, message };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _trade(params) {
    try {
      const { targetPlayer, offer, request } = params;
      
      if (!targetPlayer) {
        return { success: false, reason: 'no_target' };
      }

      this.bot.chat(`Hey ${targetPlayer}, want to trade ${offer} for ${request}?`);
      
      this.logger.info(`[${this.bot.username}] Proposed trade to ${targetPlayer}`);
      
      return { success: true, trade: 'proposed' };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _defend() {
    try {
      const hostile = Object.values(this.bot.entities).find(e => 
        e.type === 'mob' && 
        e.name &&
        ['zombie', 'skeleton', 'spider', 'creeper'].includes(e.name.toLowerCase()) &&
        e.position.distanceTo(this.bot.entity.position) < 16
      );

      if (!hostile) {
        return { success: false, reason: 'no_threat' };
      }

      const weapon = this._getBestWeapon();
      if (weapon) {
        await this.bot.equip(weapon, 'hand');
      }

      this.bot.attack(hostile);
      
      this.logger.info(`[${this.bot.username}] Defending against ${hostile.name}`);
      
      return { success: true, action: 'defended' };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _rest(duration) {
    try {
      this.logger.info(`[${this.bot.username}] Resting for ${duration}ms`);
      await new Promise(resolve => setTimeout(resolve, duration));
      return { success: true, rested: duration };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _equipBestTool(block) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const blockData = mcData.blocks[block.type];
      
      if (!blockData) return;

      const toolRanking = {
        wood: ['axe'],
        log: ['axe'],
        stone: ['pickaxe'],
        ore: ['pickaxe'],
        dirt: ['shovel'],
        sand: ['shovel'],
        gravel: ['shovel']
      };

      let preferredTool = null;
      for (const [blockType, tools] of Object.entries(toolRanking)) {
        if (blockData.name.includes(blockType)) {
          preferredTool = tools[0];
          break;
        }
      }

      if (!preferredTool) return;

      const tool = this.bot.inventory.items().find(item => 
        item.name.includes(preferredTool)
      );

      if (tool) {
        await this.bot.equip(tool, 'hand');
      }
    } catch (error) {
      this.logger.warn(`[${this.bot.username}] Could not equip tool:`, error.message);
    }
  }

  _getBestWeapon() {
    const weapons = this.bot.inventory.items().filter(item => 
      item.name.includes('sword') || 
      item.name.includes('axe') ||
      item.name.includes('bow')
    );

    const weaponPriority = ['diamond', 'iron', 'stone', 'wooden'];
    
    for (const material of weaponPriority) {
      const weapon = weapons.find(w => w.name.includes(material));
      if (weapon) return weapon;
    }

    return weapons[0] || null;
  }

  cancelCurrentAction() {
    if (this.currentAction) {
      this.logger.info(`[${this.bot.username}] Cancelling action: ${this.currentAction}`);
      this.bot.pathfinder.setGoal(null);
      this.isExecuting = false;
      this.currentAction = null;
    }
  }
}

module.exports = ActionExecutor;
