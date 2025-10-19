const { goals: Goals } = require('mineflayer-pathfinder');

/**
 * MaterialGatherer - Automatically acquires materials for building projects
 * Works independently without ActionExecutor to avoid deadlocks
 */
class MaterialGatherer {
  constructor(bot, logger) {
    this.bot = bot;
    this.logger = logger;
  }

  /**
   * Check if bot has required materials
   */
  checkMaterials(materials) {
    const inventory = this.bot.inventory.items();
    const mcData = require('minecraft-data')(this.bot.version);
    const missing = {};
    const has = {};
    
    for (const [material, needed] of Object.entries(materials)) {
      const itemData = mcData.itemsByName[material] || mcData.blocksByName[material];
      if (!itemData) {
        this.logger.warn(`[MaterialGatherer] Unknown material: ${material}`);
        continue;
      }
      
      const totalCount = inventory
        .filter(item => item.type === itemData.id)
        .reduce((sum, item) => sum + item.count, 0);
      
      has[material] = totalCount;
      
      if (totalCount < needed) {
        missing[material] = needed - totalCount;
      }
    }
    
    return {
      hasMaterials: Object.keys(missing).length === 0,
      missing: missing,
      has: has
    };
  }

  /**
   * Automatically gather missing materials for a build
   */
  async gatherMaterials(materials, options = {}) {
    const maxAttempts = options.maxAttempts || 3;
    const timeout = options.timeout || 60000; // 1 minute per material
    const startTime = Date.now();
    
    this.logger.info('[MaterialGatherer] Starting automatic material gathering...');
    
    const check = this.checkMaterials(materials);
    if (check.hasMaterials) {
      this.logger.info('[MaterialGatherer] All materials already available');
      return { success: true, gathered: {} };
    }
    
    const gathered = {};
    const failed = {};
    
    // Priority order for gathering
    const gatheringPlan = this._createGatheringPlan(check.missing);
    
    for (const task of gatheringPlan) {
      if (Date.now() - startTime > timeout * gatheringPlan.length) {
        this.logger.warn('[MaterialGatherer] Timeout reached, stopping gathering');
        break;
      }
      
      this.logger.info(`[MaterialGatherer] Gathering ${task.amount} ${task.material}...`);
      
      let attempts = 0;
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        const result = await this._gatherSingleMaterial(task.material, task.amount);
        
        if (result.success) {
          gathered[task.material] = result.amount || task.amount;
          success = true;
          this.logger.info(`[MaterialGatherer] Successfully gathered ${task.material}`);
        } else {
          attempts++;
          this.logger.warn(`[MaterialGatherer] Failed to gather ${task.material}, attempt ${attempts}/${maxAttempts}: ${result.reason}`);
          
          if (attempts < maxAttempts) {
            await this._wait(2000); // Wait before retry
          }
        }
      }
      
      if (!success) {
        failed[task.material] = task.amount;
      }
    }
    
    const finalCheck = this.checkMaterials(materials);
    
    return {
      success: finalCheck.hasMaterials,
      gathered: gathered,
      failed: failed,
      stillMissing: finalCheck.missing,
      timeTaken: Date.now() - startTime
    };
  }

  /**
   * Create an optimized gathering plan
   */
  _createGatheringPlan(missing) {
    const plan = [];
    
    // Group materials by gathering method
    const woodTypes = ['oak_planks', 'spruce_planks', 'birch_planks', 'oak_log', 'spruce_log'];
    const stoneTypes = ['cobblestone', 'stone', 'dirt'];
    const oreTypes = ['iron_ore', 'coal_ore', 'gold_ore'];
    
    for (const [material, amount] of Object.entries(missing)) {
      let gatherMethod = 'craft';
      let priority = 5;
      
      if (woodTypes.some(type => material.includes(type.split('_')[0]))) {
        gatherMethod = 'wood';
        priority = 1;
      } else if (stoneTypes.includes(material)) {
        gatherMethod = 'stone';
        priority = 2;
      } else if (oreTypes.includes(material)) {
        gatherMethod = 'ore';
        priority = 3;
      }
      
      plan.push({
        material,
        amount,
        method: gatherMethod,
        priority
      });
    }
    
    // Sort by priority (gather basic materials first)
    plan.sort((a, b) => a.priority - b.priority);
    
    return plan;
  }

  /**
   * Gather a single material type - DIRECT implementation without ActionExecutor
   */
  async _gatherSingleMaterial(material, amount) {
    try {
      // Determine gathering method and gather directly
      if (material.includes('log') || material.includes('oak') || material.includes('spruce') || material.includes('birch')) {
        return await this._directGatherWood(amount);
      }
      
      if (material.includes('cobblestone') || material.includes('stone') || material.includes('dirt')) {
        return await this._directGatherStone(amount);
      }
      
      if (material.includes('ore') || material.includes('iron') || material.includes('coal')) {
        return await this._directMineOre(material, amount);
      }
      
      if (material.includes('glass')) {
        const sandResult = await this._gatherSand(Math.ceil(amount));
        if (sandResult.success) {
          return await this._smeltGlass(amount);
        }
        return sandResult;
      }
      
      if (material.includes('plank')) {
        const logAmount = Math.ceil(amount / 4);
        const logResult = await this._directGatherWood(logAmount);
        if (logResult.success) {
          return await this._craftPlanks(amount);
        }
        return logResult;
      }
      
      if (material.includes('door') || material.includes('chest') || material.includes('crafting_table') || material.includes('torch') || material.includes('furnace')) {
        return await this._craftItem(material, amount);
      }
      
      if (material.includes('fence')) {
        return await this._craftItem(material, amount);
      }
      
      this.logger.warn(`[MaterialGatherer] No gathering method for ${material}`);
      return { success: false, reason: 'no_gather_method' };
      
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Direct wood gathering without ActionExecutor
   */
  async _directGatherWood(targetAmount) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const logTypes = ['oak_log', 'spruce_log', 'birch_log', 'log'];
      let logBlock = null;
      
      for (const type of logTypes) {
        logBlock = mcData.blocksByName[type];
        if (logBlock) break;
      }
      
      if (!logBlock) {
        return { success: false, reason: 'no_wood_type' };
      }

      let gathered = 0;
      const maxAttempts = Math.min(targetAmount * 2, 20);
      
      for (let attempt = 0; attempt < maxAttempts && gathered < targetAmount; attempt++) {
        const block = this.bot.findBlock({
          matching: logBlock.id,
          maxDistance: 64
        });

        if (!block) {
          this.logger.debug(`[MaterialGatherer] No more wood found nearby after ${gathered} logs`);
          break;
        }

        try {
          const goal = new Goals.GoalBlock(block.position.x, block.position.y, block.position.z);
          await this.bot.pathfinder.goto(goal);
          await this.bot.dig(block);
          gathered++;
          
          if (gathered % 5 === 0) {
            this.logger.info(`[MaterialGatherer] Gathered ${gathered}/${targetAmount} wood`);
          }
        } catch (err) {
          this.logger.debug(`[MaterialGatherer] Failed to gather log: ${err.message}`);
        }
      }

      return { 
        success: gathered >= targetAmount,
        amount: gathered,
        item: 'wood' 
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Direct stone gathering without ActionExecutor
   */
  async _directGatherStone(targetAmount) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const stoneTypes = ['stone', 'cobblestone', 'dirt'];
      let stoneBlock = null;
      
      for (const type of stoneTypes) {
        stoneBlock = mcData.blocksByName[type];
        if (stoneBlock) break;
      }
      
      if (!stoneBlock) {
        return { success: false, reason: 'no_stone_type' };
      }

      let gathered = 0;
      const maxAttempts = Math.min(targetAmount * 2, 30);
      
      for (let attempt = 0; attempt < maxAttempts && gathered < targetAmount; attempt++) {
        const block = this.bot.findBlock({
          matching: stoneBlock.id,
          maxDistance: 64
        });

        if (!block) {
          this.logger.debug(`[MaterialGatherer] No more stone found nearby after ${gathered} blocks`);
          break;
        }

        try {
          const goal = new Goals.GoalBlock(block.position.x, block.position.y, block.position.z);
          await this.bot.pathfinder.goto(goal);
          await this.bot.dig(block);
          gathered++;
          
          if (gathered % 10 === 0) {
            this.logger.info(`[MaterialGatherer] Gathered ${gathered}/${targetAmount} stone`);
          }
        } catch (err) {
          this.logger.debug(`[MaterialGatherer] Failed to gather stone: ${err.message}`);
        }
      }

      return { 
        success: gathered >= targetAmount,
        amount: gathered,
        item: 'stone' 
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Direct ore mining without ActionExecutor
   */
  async _directMineOre(oreType, targetAmount) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const oreBlock = mcData.blocksByName[oreType];
      
      if (!oreBlock) {
        return { success: false, reason: 'invalid_ore_type' };
      }

      let mined = 0;
      const maxAttempts = Math.min(targetAmount * 3, 15);
      
      for (let attempt = 0; attempt < maxAttempts && mined < targetAmount; attempt++) {
        const block = this.bot.findBlock({
          matching: oreBlock.id,
          maxDistance: 64
        });

        if (!block) {
          this.logger.debug(`[MaterialGatherer] No more ${oreType} found nearby`);
          break;
        }

        try {
          const goal = new Goals.GoalBlock(block.position.x, block.position.y, block.position.z);
          await this.bot.pathfinder.goto(goal);
          await this.bot.dig(block);
          mined++;
          
          this.logger.info(`[MaterialGatherer] Mined ${mined}/${targetAmount} ${oreType}`);
        } catch (err) {
          this.logger.debug(`[MaterialGatherer] Failed to mine ore: ${err.message}`);
        }
      }

      return { 
        success: mined >= targetAmount,
        amount: mined,
        item: oreType 
      };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _gatherSand(amount) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const sandBlock = mcData.blocksByName['sand'];
      
      if (!sandBlock) {
        return { success: false, reason: 'no_sand_block_type' };
      }
      
      for (let i = 0; i < amount; i++) {
        const block = this.bot.findBlock({
          matching: sandBlock.id,
          maxDistance: 32
        });
        
        if (!block) {
          return { success: i > 0, amount: i, reason: 'no_sand_found' };
        }
        
        await this.bot.dig(block);
      }
      
      return { success: true, amount };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _smeltGlass(amount) {
    // Simplified - in reality would need furnace and fuel
    return { success: false, reason: 'smelting_not_implemented' };
  }

  async _craftPlanks(amount) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const planks = mcData.itemsByName['oak_planks'];
      
      if (!planks) {
        return { success: false, reason: 'no_planks_recipe' };
      }
      
      const recipe = this.bot.recipesFor(planks.id, null, 1, null)[0];
      if (!recipe) {
        return { success: false, reason: 'no_recipe_found' };
      }
      
      const craftAmount = Math.ceil(amount / 4);
      await this.bot.craft(recipe, craftAmount, null);
      
      return { success: true, amount: craftAmount * 4 };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _craftItem(itemName, amount) {
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
      
      await this.bot.craft(recipe, amount, null);
      return { success: true, amount };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MaterialGatherer;
