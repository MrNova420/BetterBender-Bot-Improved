const { goals: Goals } = require('mineflayer-pathfinder');

/**
 * MaterialGatherer - Automatically acquires materials for building projects
 */
class MaterialGatherer {
  constructor(bot, logger, actionExecutor) {
    this.bot = bot;
    this.logger = logger;
    this.actionExecutor = actionExecutor;
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
   * Gather a single material type
   */
  async _gatherSingleMaterial(material, amount) {
    try {
      // Determine gathering method
      if (material.includes('log') || material.includes('oak') || material.includes('spruce') || material.includes('birch')) {
        return await this.actionExecutor.executeAction('gather_wood', { amount: Math.ceil(amount / 4) });
      }
      
      if (material.includes('cobblestone') || material.includes('stone') || material.includes('dirt')) {
        return await this.actionExecutor.executeAction('gather_stone', { amount });
      }
      
      if (material.includes('ore') || material.includes('iron') || material.includes('coal')) {
        return await this.actionExecutor.executeAction('mine_ore', { oreType: material });
      }
      
      if (material.includes('glass')) {
        // Glass requires sand and smelting
        const sandResult = await this._gatherSand(Math.ceil(amount));
        if (sandResult.success) {
          return await this._smeltGlass(amount);
        }
        return sandResult;
      }
      
      if (material.includes('plank')) {
        // Planks are crafted from logs
        const logAmount = Math.ceil(amount / 4);
        const logResult = await this.actionExecutor.executeAction('gather_wood', { amount: logAmount });
        if (logResult.success) {
          return await this._craftPlanks(amount);
        }
        return logResult;
      }
      
      // For craftable items, try to craft them
      if (material.includes('door') || material.includes('chest') || material.includes('crafting_table')) {
        return await this._craftItem(material, amount);
      }
      
      this.logger.warn(`[MaterialGatherer] No gathering method for ${material}`);
      return { success: false, reason: 'no_gather_method' };
      
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
