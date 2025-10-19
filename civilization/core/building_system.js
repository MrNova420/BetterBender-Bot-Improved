const Vec3 = require('vec3');
const { goals: Goals } = require('mineflayer-pathfinder');

/**
 * Comprehensive Building System for Civilization
 * Handles construction of houses, farms, workshops, and village infrastructure
 */
class BuildingSystem {
  constructor(bot, logger) {
    this.bot = bot;
    this.logger = logger;
    
    this.structureTemplates = this._initializeTemplates();
    this.currentBuild = null;
    this.buildProgress = [];
  }

  _initializeTemplates() {
    return {
      small_house: {
        name: 'Small House',
        dimensions: { width: 7, height: 4, depth: 7 },
        materials: {
          'oak_planks': 120,
          'glass': 8,
          'oak_door': 1,
          'torch': 4,
          'crafting_table': 1,
          'chest': 2
        },
        blueprint: 'small_house'
      },
      
      medium_house: {
        name: 'Medium House',
        dimensions: { width: 11, height: 5, depth: 9 },
        materials: {
          'oak_planks': 250,
          'glass': 16,
          'oak_door': 2,
          'torch': 8,
          'crafting_table': 1,
          'chest': 4,
          'bed': 1
        },
        blueprint: 'medium_house'
      },
      
      farm: {
        name: 'Farm',
        dimensions: { width: 9, height: 1, depth: 9 },
        materials: {
          'dirt': 81,
          'water_bucket': 1,
          'oak_fence': 36,
          'wheat_seeds': 80,
          'torch': 4
        },
        blueprint: 'farm'
      },
      
      workshop: {
        name: 'Workshop',
        dimensions: { width: 9, height: 4, depth: 9 },
        materials: {
          'cobblestone': 200,
          'glass': 12,
          'iron_door': 1,
          'crafting_table': 2,
          'furnace': 4,
          'chest': 6,
          'torch': 8
        },
        blueprint: 'workshop'
      },
      
      storage_building: {
        name: 'Storage Building',
        dimensions: { width: 7, height: 3, depth: 7 },
        materials: {
          'oak_planks': 100,
          'chest': 12,
          'torch': 6
        },
        blueprint: 'storage'
      },
      
      road: {
        name: 'Road',
        dimensions: { width: 3, height: 1, length: 20 },
        materials: {
          'cobblestone': 60,
          'torch': 4
        },
        blueprint: 'road'
      },
      
      bridge: {
        name: 'Bridge',
        dimensions: { width: 5, height: 2, length: 15 },
        materials: {
          'oak_planks': 75,
          'oak_fence': 30
        },
        blueprint: 'bridge'
      }
    };
  }

  /**
   * Start building a structure at the specified location
   */
  async buildStructure(structureType, location, options = {}) {
    try {
      const template = this.structureTemplates[structureType];
      if (!template) {
        this.logger.error(`[BuildingSystem] Unknown structure type: ${structureType}`);
        return { success: false, reason: 'unknown_structure_type' };
      }

      this.logger.info(`[BuildingSystem] Starting construction of ${template.name}`);
      
      // Check if we have materials
      const hasMaterials = await this._checkMaterials(template.materials);
      if (!hasMaterials && !options.skipMaterialCheck) {
        this.logger.warn(`[BuildingSystem] Insufficient materials for ${template.name}`);
        return { success: false, reason: 'insufficient_materials', needed: template.materials };
      }

      // Initialize build state
      this.currentBuild = {
        type: structureType,
        template: template,
        location: location,
        startTime: Date.now(),
        progress: 0
      };

      // Execute blueprint
      let result;
      switch (template.blueprint) {
        case 'small_house':
        case 'medium_house':
          result = await this._buildHouse(location, template);
          break;
        case 'farm':
          result = await this._buildFarm(location, template);
          break;
        case 'workshop':
        case 'storage':
          result = await this._buildWorkshop(location, template);
          break;
        case 'road':
          result = await this._buildRoad(location, template);
          break;
        case 'bridge':
          result = await this._buildBridge(location, template);
          break;
        default:
          result = { success: false, reason: 'no_blueprint_handler' };
      }

      if (result.success) {
        this.buildProgress.push({
          structure: template.name,
          location: location,
          completedAt: Date.now(),
          timeTaken: Date.now() - this.currentBuild.startTime
        });
        this.logger.info(`[BuildingSystem] Completed ${template.name} in ${((Date.now() - this.currentBuild.startTime) / 1000).toFixed(1)}s`);
      }

      this.currentBuild = null;
      return result;

    } catch (error) {
      this.logger.error(`[BuildingSystem] Build error: ${error.message}`);
      this.currentBuild = null;
      return { success: false, reason: error.message };
    }
  }

  /**
   * Build a complete house with walls, roof, door, and windows
   */
  async _buildHouse(location, template) {
    const { width, height, depth } = template.dimensions;
    const basePos = location;

    try {
      // Step 1: Clear area and build foundation
      this.logger.info('[BuildingSystem] Building foundation...');
      await this._buildFoundation(basePos, width, depth, 'oak_planks');

      // Step 2: Build walls with door and window openings
      this.logger.info('[BuildingSystem] Building walls...');
      await this._buildWalls(basePos, width, height, depth, 'oak_planks');

      // Step 3: Add door
      this.logger.info('[BuildingSystem] Adding door...');
      const doorPos = new Vec3(
        Math.floor(basePos.x + width / 2),
        basePos.y + 1,
        basePos.z
      );
      await this._placeDoor(doorPos, 'oak_door');

      // Step 4: Add windows
      this.logger.info('[BuildingSystem] Adding windows...');
      await this._addWindows(basePos, width, height, depth);

      // Step 5: Build roof
      this.logger.info('[BuildingSystem] Building roof...');
      await this._buildRoof(basePos, width, height, depth, 'oak_planks');

      // Step 6: Add interior (torches, chests, crafting table)
      this.logger.info('[BuildingSystem] Adding interior...');
      await this._addInterior(basePos, width, depth, template);

      this.logger.info('[BuildingSystem] House construction complete!');
      return { success: true, structure: 'house', blocks_placed: width * height * depth };

    } catch (error) {
      this.logger.error(`[BuildingSystem] House building error: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Build a farm with plots, water source, and fencing
   */
  async _buildFarm(location, template) {
    const { width, depth } = template.dimensions;
    const basePos = location;

    try {
      // Step 1: Create farmland plots
      this.logger.info('[BuildingSystem] Creating farmland plots...');
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
          const plotPos = new Vec3(basePos.x + x, basePos.y, basePos.z + z);
          
          // Place water in center
          if (x === Math.floor(width / 2) && z === Math.floor(depth / 2)) {
            await this._placeBlock('water', plotPos);
          } else {
            // Hoe the dirt to create farmland
            await this._hoeDirt(plotPos);
          }
        }
      }

      // Step 2: Add fencing around farm
      this.logger.info('[BuildingSystem] Adding fence...');
      await this._buildFence(basePos, width, depth, 'oak_fence');

      // Step 3: Plant crops
      this.logger.info('[BuildingSystem] Planting crops...');
      await this._plantCrops(basePos, width, depth, 'wheat_seeds');

      // Step 4: Add lighting
      this.logger.info('[BuildingSystem] Adding torches...');
      await this._addFarmLighting(basePos, width, depth);

      this.logger.info('[BuildingSystem] Farm construction complete!');
      return { success: true, structure: 'farm', size: width * depth };

    } catch (error) {
      this.logger.error(`[BuildingSystem] Farm building error: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Build a workshop with workbenches and storage
   */
  async _buildWorkshop(location, template) {
    const { width, height, depth } = template.dimensions;
    const basePos = location;

    try {
      // Build basic structure (similar to house but sturdier)
      this.logger.info('[BuildingSystem] Building workshop structure...');
      await this._buildFoundation(basePos, width, depth, 'cobblestone');
      await this._buildWalls(basePos, width, height, depth, 'cobblestone');
      
      const doorPos = new Vec3(
        Math.floor(basePos.x + width / 2),
        basePos.y + 1,
        basePos.z
      );
      await this._placeDoor(doorPos, 'iron_door');
      
      await this._buildRoof(basePos, width, height, depth, 'cobblestone');

      // Add workshop equipment
      this.logger.info('[BuildingSystem] Adding equipment...');
      await this._addWorkshopEquipment(basePos, width, depth, template);

      this.logger.info('[BuildingSystem] Workshop construction complete!');
      return { success: true, structure: 'workshop' };

    } catch (error) {
      this.logger.error(`[BuildingSystem] Workshop building error: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Build a road connecting two points
   */
  async _buildRoad(startLocation, template) {
    const { width, length } = template.dimensions;
    const basePos = startLocation;

    try {
      this.logger.info('[BuildingSystem] Building road...');
      
      for (let z = 0; z < length; z++) {
        for (let x = 0; x < width; x++) {
          const roadPos = new Vec3(basePos.x + x, basePos.y, basePos.z + z);
          await this._placeBlock('cobblestone', roadPos);
        }
        
        // Add torches every 5 blocks
        if (z % 5 === 0) {
          const torchPos = new Vec3(basePos.x, basePos.y + 1, basePos.z + z);
          await this._placeBlock('torch', torchPos);
        }
      }

      this.logger.info('[BuildingSystem] Road construction complete!');
      return { success: true, structure: 'road', length: length };

    } catch (error) {
      this.logger.error(`[BuildingSystem] Road building error: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Build a bridge over water or gaps
   */
  async _buildBridge(location, template) {
    const { width, height, length } = template.dimensions;
    const basePos = location;

    try {
      this.logger.info('[BuildingSystem] Building bridge...');
      
      // Build bridge deck
      for (let z = 0; z < length; z++) {
        for (let x = 0; x < width; x++) {
          const deckPos = new Vec3(basePos.x + x, basePos.y, basePos.z + z);
          await this._placeBlock('oak_planks', deckPos);
        }
      }

      // Add railings
      for (let z = 0; z < length; z++) {
        const leftRail = new Vec3(basePos.x, basePos.y + 1, basePos.z + z);
        const rightRail = new Vec3(basePos.x + width - 1, basePos.y + 1, basePos.z + z);
        
        await this._placeBlock('oak_fence', leftRail);
        await this._placeBlock('oak_fence', rightRail);
      }

      this.logger.info('[BuildingSystem] Bridge construction complete!');
      return { success: true, structure: 'bridge', length: length };

    } catch (error) {
      this.logger.error(`[BuildingSystem] Bridge building error: ${error.message}`);
      return { success: false, reason: error.message };
    }
  }

  // ============= HELPER METHODS =============

  async _buildFoundation(basePos, width, depth, material) {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const pos = new Vec3(basePos.x + x, basePos.y, basePos.z + z);
        await this._placeBlock(material, pos);
      }
    }
  }

  async _buildWalls(basePos, width, height, depth, material) {
    for (let y = 1; y <= height; y++) {
      // Front and back walls
      for (let x = 0; x < width; x++) {
        const frontPos = new Vec3(basePos.x + x, basePos.y + y, basePos.z);
        const backPos = new Vec3(basePos.x + x, basePos.y + y, basePos.z + depth - 1);
        
        // Leave space for door in front center
        if (!(y <= 2 && x === Math.floor(width / 2) && frontPos.z === basePos.z)) {
          await this._placeBlock(material, frontPos);
        }
        await this._placeBlock(material, backPos);
      }
      
      // Side walls
      for (let z = 1; z < depth - 1; z++) {
        const leftPos = new Vec3(basePos.x, basePos.y + y, basePos.z + z);
        const rightPos = new Vec3(basePos.x + width - 1, basePos.y + y, basePos.z + z);
        await this._placeBlock(material, leftPos);
        await this._placeBlock(material, rightPos);
      }
    }
  }

  async _buildRoof(basePos, width, height, depth, material) {
    const roofY = basePos.y + height;
    
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const roofPos = new Vec3(basePos.x + x, roofY, basePos.z + z);
        await this._placeBlock(material, roofPos);
      }
    }
  }

  async _addWindows(basePos, width, height, depth) {
    const windowY = basePos.y + 2;
    
    // Windows on sides
    const leftWindow = new Vec3(basePos.x, windowY, basePos.z + Math.floor(depth / 2));
    const rightWindow = new Vec3(basePos.x + width - 1, windowY, basePos.z + Math.floor(depth / 2));
    const backWindow = new Vec3(basePos.x + Math.floor(width / 2), windowY, basePos.z + depth - 1);
    
    await this._placeBlock('glass', leftWindow);
    await this._placeBlock('glass', rightWindow);
    await this._placeBlock('glass', backWindow);
  }

  async _addInterior(basePos, width, depth, template) {
    // Place crafting table
    const craftingPos = new Vec3(basePos.x + 1, basePos.y + 1, basePos.z + 1);
    await this._placeBlock('crafting_table', craftingPos);
    
    // Place chests
    const chest1Pos = new Vec3(basePos.x + width - 2, basePos.y + 1, basePos.z + 1);
    const chest2Pos = new Vec3(basePos.x + width - 2, basePos.y + 1, basePos.z + 2);
    await this._placeBlock('chest', chest1Pos);
    await this._placeBlock('chest', chest2Pos);
    
    // Place torches for lighting
    const torch1 = new Vec3(basePos.x + 1, basePos.y + 2, basePos.z + 1);
    const torch2 = new Vec3(basePos.x + width - 2, basePos.y + 2, basePos.z + depth - 2);
    await this._placeBlock('torch', torch1);
    await this._placeBlock('torch', torch2);
  }

  async _buildFence(basePos, width, depth, fenceMaterial) {
    // Build fence around perimeter
    for (let x = -1; x <= width; x++) {
      const frontFence = new Vec3(basePos.x + x, basePos.y + 1, basePos.z - 1);
      const backFence = new Vec3(basePos.x + x, basePos.y + 1, basePos.z + depth);
      await this._placeBlock(fenceMaterial, frontFence);
      await this._placeBlock(fenceMaterial, backFence);
    }
    
    for (let z = 0; z < depth; z++) {
      const leftFence = new Vec3(basePos.x - 1, basePos.y + 1, basePos.z + z);
      const rightFence = new Vec3(basePos.x + width, basePos.y + 1, basePos.z + z);
      await this._placeBlock(fenceMaterial, leftFence);
      await this._placeBlock(fenceMaterial, rightFence);
    }
  }

  async _plantCrops(basePos, width, depth, seedType) {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        // Skip water source
        if (x === Math.floor(width / 2) && z === Math.floor(depth / 2)) continue;
        
        const plotPos = new Vec3(basePos.x + x, basePos.y + 1, basePos.z + z);
        await this._plantSeed(seedType, plotPos);
      }
    }
  }

  async _addFarmLighting(basePos, width, depth) {
    const corners = [
      new Vec3(basePos.x, basePos.y + 2, basePos.z),
      new Vec3(basePos.x + width - 1, basePos.y + 2, basePos.z),
      new Vec3(basePos.x, basePos.y + 2, basePos.z + depth - 1),
      new Vec3(basePos.x + width - 1, basePos.y + 2, basePos.z + depth - 1)
    ];
    
    for (const corner of corners) {
      await this._placeBlock('torch', corner);
    }
  }

  async _addWorkshopEquipment(basePos, width, depth, template) {
    // Place furnaces in a row
    for (let i = 0; i < 4; i++) {
      const furnacePos = new Vec3(basePos.x + 1, basePos.y + 1, basePos.z + 1 + i);
      await this._placeBlock('furnace', furnacePos);
    }
    
    // Place crafting tables
    const craft1 = new Vec3(basePos.x + 3, basePos.y + 1, basePos.z + 1);
    const craft2 = new Vec3(basePos.x + 3, basePos.y + 1, basePos.z + 2);
    await this._placeBlock('crafting_table', craft1);
    await this._placeBlock('crafting_table', craft2);
    
    // Place storage chests along wall
    for (let i = 0; i < 6; i++) {
      const chestPos = new Vec3(basePos.x + width - 2, basePos.y + 1, basePos.z + 1 + i);
      await this._placeBlock('chest', chestPos);
    }
  }

  async _placeBlock(blockType, position) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const blockData = mcData.blocksByName[blockType];
      
      if (!blockData) {
        this.logger.warn(`[BuildingSystem] Unknown block type: ${blockType}`);
        return false;
      }

      // Check if block already exists
      const existingBlock = this.bot.blockAt(position);
      if (existingBlock && existingBlock.name !== 'air' && existingBlock.name !== blockType) {
        this.logger.debug(`[BuildingSystem] Block already exists at ${position}, skipping`);
        return false;
      }

      // Find item in inventory
      const item = this.bot.inventory.items().find(i => i.type === blockData.id);
      if (!item) {
        this.logger.debug(`[BuildingSystem] No ${blockType} in inventory`);
        return false;
      }

      // Equip block
      await this.bot.equip(item, 'hand');

      // Navigate to placement location if far away
      const distance = this.bot.entity.position.distanceTo(position);
      if (distance > 4) {
        const goal = new Goals.GoalNear(position.x, position.y, position.z, 3);
        await this.bot.pathfinder.goto(goal);
      }

      // Find reference block to place against
      const referenceBlock = this.bot.blockAt(position.offset(0, -1, 0));
      if (!referenceBlock || referenceBlock.name === 'air') {
        this.logger.debug(`[BuildingSystem] No reference block for placement`);
        return false;
      }

      // Place block
      await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
      this.logger.debug(`[BuildingSystem] Placed ${blockType} at (${position.x}, ${position.y}, ${position.z})`);
      
      return true;

    } catch (error) {
      this.logger.error(`[BuildingSystem] Error placing block: ${error.message}`);
      return false;
    }
  }

  async _placeDoor(position, doorType) {
    // Doors need special handling as they occupy 2 blocks
    await this._placeBlock(doorType, position);
    // Note: Door automatically places upper half in Minecraft
  }

  async _hoeDirt(position) {
    try {
      // Equip hoe if available
      const hoe = this.bot.inventory.items().find(item => 
        item.name && item.name.includes('hoe')
      );
      
      if (hoe) {
        await this.bot.equip(hoe, 'hand');
      }

      const block = this.bot.blockAt(position);
      if (block && (block.name === 'dirt' || block.name === 'grass_block')) {
        await this.bot.activateBlock(block);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`[BuildingSystem] Error hoeing dirt: ${error.message}`);
      return false;
    }
  }

  async _plantSeed(seedType, position) {
    try {
      const mcData = require('minecraft-data')(this.bot.version);
      const seedData = mcData.itemsByName[seedType];
      
      if (!seedData) return false;

      const seed = this.bot.inventory.items().find(i => i.type === seedData.id);
      if (!seed) return false;

      await this.bot.equip(seed, 'hand');
      
      const block = this.bot.blockAt(position.offset(0, -1, 0));
      if (block && block.name === 'farmland') {
        await this.bot.placeBlock(block, new Vec3(0, 1, 0));
      }
      
      return true;
    } catch (error) {
      this.logger.error(`[BuildingSystem] Error planting seed: ${error.message}`);
      return false;
    }
  }

  async _checkMaterials(materials) {
    const inventory = this.bot.inventory.items();
    const mcData = require('minecraft-data')(this.bot.version);
    
    for (const [material, needed] of Object.entries(materials)) {
      const itemData = mcData.itemsByName[material] || mcData.blocksByName[material];
      if (!itemData) continue;
      
      const totalCount = inventory
        .filter(item => item.type === itemData.id)
        .reduce((sum, item) => sum + item.count, 0);
      
      if (totalCount < needed) {
        this.logger.warn(`[BuildingSystem] Need ${needed} ${material}, have ${totalCount}`);
        return false;
      }
    }
    
    return true;
  }

  getMaterialsNeeded(structureType) {
    const template = this.structureTemplates[structureType];
    return template ? template.materials : null;
  }

  getAvailableStructures() {
    return Object.keys(this.structureTemplates);
  }

  getBuildProgress() {
    return this.buildProgress;
  }

  getCurrentBuild() {
    return this.currentBuild;
  }
}

module.exports = BuildingSystem;
