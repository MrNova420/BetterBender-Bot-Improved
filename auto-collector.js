const Vec3 = require('vec3');
const { goals } = require('mineflayer-pathfinder');

class AutoCollector {
   constructor(bot) {
      this.bot = bot;
      this.collectBlock = bot.collectBlock;
      this.isCollecting = true;
      this.collectionQueue = [];
      this.collectedItems = {};
   }

   async collectMaterials(materialsList) {
      console.log('📦 Starting auto-collection for:', materialsList);
      this.isCollecting = true;
      const results = { collected: {}, missing: {} };

      for (const [material, amount] of Object.entries(materialsList)) {
         const collected = await this.collectMaterial(material, amount);
         
         if (collected >= amount) {
            results.collected[material] = collected;
            console.log(`✅ Collected ${collected}/${amount} ${material}`);
         } else {
            results.missing[material] = amount - collected;
            console.log(`⚠️  Only collected ${collected}/${amount} ${material}`);
         }
      }

      this.isCollecting = true;
      return results;
   }

   async collectMaterial(material, targetAmount) {
      const mcData = require('minecraft-data')(this.bot.version);
      let collected = 0;

      const inventoryCount = this.countInInventory(material);
      if (inventoryCount >= targetAmount) {
         console.log(`✓ Already have ${inventoryCount} ${material} in inventory`);
         return inventoryCount;
      }

      collected = inventoryCount;
      const needed = targetAmount - collected;

      if (material.includes('_ore')) {
         collected += await this.mineOre(material, needed);
      } else if (material.includes('_log') || material === 'oak_planks' || material === 'spruce_planks') {
         collected += await this.chopWood(material, needed);
      } else if (material === 'cobblestone' || material === 'stone' || material === 'stone_bricks') {
         collected += await this.mineStone(material, needed);
      } else if (material === 'glass') {
         collected += await this.collectSand(needed);
      } else if (material.includes('_planks')) {
         collected += await this.craftPlanks(material, needed);
      } else {
         collected += await this.collectGeneric(material, needed);
      }

      this.collectedItems[material] = (this.collectedItems[material] || 0) + collected;
      return collected;
   }

   async mineOre(oreType, amount) {
      console.log(`⛏️  Mining ${amount} ${oreType}...`);
      const mcData = require('minecraft-data')(this.bot.version);
      const oreBlock = mcData.blocksByName[oreType];
      
      if (!oreBlock) {
         console.log(`❌ Unknown ore: ${oreType}`);
         return 0;
      }

      let mined = 0;
      const searchRadius = 64;
      const maxAttempts = 20;

      for (let attempt = 0; attempt < maxAttempts && mined < amount; attempt++) {
         const blocks = this.bot.findBlocks({
            matching: oreBlock.id,
            maxDistance: searchRadius,
            count: 10
         });

         if (blocks.length === 0) {
            console.log(`🔍 No ${oreType} found nearby, exploring...`);
            await this.exploreForOre(oreType);
            continue;
         }

         for (const blockPos of blocks) {
            if (mined >= amount) break;

            try {
               await this.bot.pathfinder.goto(new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 3));
               
               const block = this.bot.blockAt(blockPos);
               if (block && block.name === oreType) {
                  await this.equipBestTool(block);
                  await this.bot.dig(block);
                  mined++;
                  console.log(`⛏️  Mined ${oreType} (${mined}/${amount})`);
                  await this.bot.waitForTicks(10);
               }
            } catch (error) {
               console.log(`⚠️  Mining error: ${error.message}`);
            }
         }
      }

      return mined;
   }

   async chopWood(woodType, amount) {
      console.log(`🪓 Chopping ${amount} wood...`);
      const mcData = require('minecraft-data')(this.bot.version);
      let chopped = 0;

      const logTypes = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'];
      const searchLogs = woodType.includes('_log') ? [woodType] : logTypes;

      for (let attempt = 0; attempt < 15 && chopped < amount; attempt++) {
         let foundLog = false;

         for (const logType of searchLogs) {
            const logBlock = mcData.blocksByName[logType];
            if (!logBlock) continue;

            const blocks = this.bot.findBlocks({
               matching: logBlock.id,
               maxDistance: 48,
               count: 5
            });

            for (const blockPos of blocks) {
               if (chopped >= amount) break;

               try {
                  await this.bot.pathfinder.goto(new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 3));
                  
                  const block = this.bot.blockAt(blockPos);
                  if (block && block.name === logType) {
                     await this.equipBestTool(block);
                     await this.bot.dig(block);
                     chopped++;
                     foundLog = true;
                     console.log(`🪓 Chopped ${logType} (${chopped}/${amount})`);
                     await this.bot.waitForTicks(10);
                  }
               } catch (error) {
                  console.log(`⚠️  Chopping error: ${error.message}`);
               }
            }
         }

         if (!foundLog) {
            await this.exploreForResource('tree');
         }
      }

      return chopped;
   }

   async mineStone(stoneType, amount) {
      console.log(`⛏️  Mining ${amount} ${stoneType}...`);
      const mcData = require('minecraft-data')(this.bot.version);
      let mined = 0;

      const targetBlock = stoneType === 'cobblestone' ? 'stone' : stoneType;
      const block = mcData.blocksByName[targetBlock];
      
      if (!block) {
         console.log(`❌ Unknown stone: ${stoneType}`);
         return 0;
      }

      for (let attempt = 0; attempt < 30 && mined < amount; attempt++) {
         const blocks = this.bot.findBlocks({
            matching: block.id,
            maxDistance: 32,
            count: 10
         });

         if (blocks.length === 0) {
            await this.digDown(3);
            continue;
         }

         for (const blockPos of blocks) {
            if (mined >= amount) break;

            try {
               await this.bot.pathfinder.goto(new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 3));
               
               const stoneBlock = this.bot.blockAt(blockPos);
               if (stoneBlock && (stoneBlock.name === 'stone' || stoneBlock.name === targetBlock)) {
                  await this.equipBestTool(stoneBlock);
                  await this.bot.dig(stoneBlock);
                  mined++;
                  console.log(`⛏️  Mined ${stoneType} (${mined}/${amount})`);
                  await this.bot.waitForTicks(5);
               }
            } catch (error) {
               console.log(`⚠️  Mining error: ${error.message}`);
            }
         }
      }

      return mined;
   }

   async collectSand(amount) {
      console.log(`🏖️  Collecting ${amount} sand...`);
      const mcData = require('minecraft-data')(this.bot.version);
      const sandBlock = mcData.blocksByName['sand'];
      let collected = 0;

      for (let attempt = 0; attempt < 20 && collected < amount; attempt++) {
         const blocks = this.bot.findBlocks({
            matching: sandBlock.id,
            maxDistance: 64,
            count: 10
         });

         if (blocks.length === 0) {
            console.log('🔍 Searching for sand...');
            await this.exploreForResource('sand');
            continue;
         }

         for (const blockPos of blocks) {
            if (collected >= amount) break;

            try {
               await this.bot.pathfinder.goto(new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 3));
               
               const block = this.bot.blockAt(blockPos);
               if (block && block.name === 'sand') {
                  await this.bot.dig(block);
                  collected++;
                  console.log(`🏖️  Collected sand (${collected}/${amount})`);
                  await this.bot.waitForTicks(5);
               }
            } catch (error) {
               console.log(`⚠️  Collection error: ${error.message}`);
            }
         }
      }

      return collected;
   }

   async craftPlanks(plankType, amount) {
      console.log(`🔨 Crafting ${amount} ${plankType}...`);
      
      const logType = plankType.replace('_planks', '_log');
      const logsNeeded = Math.ceil(amount / 4);
      
      await this.chopWood(logType, logsNeeded);

      const recipe = this.bot.recipesFor(this.bot.registry.itemsByName[plankType].id)[0];
      if (recipe) {
         const craftCount = Math.ceil(amount / 4);
         for (let i = 0; i < craftCount; i++) {
            try {
               await this.bot.craft(recipe, 1);
            } catch (error) {
               console.log(`⚠️  Crafting error: ${error.message}`);
            }
         }
      }

      return this.countInInventory(plankType);
   }

   async collectGeneric(material, amount) {
      console.log(`📦 Collecting ${amount} ${material}...`);
      const mcData = require('minecraft-data')(this.bot.version);
      const block = mcData.blocksByName[material];
      
      if (!block) {
         console.log(`⚠️  ${material} not available for collection`);
         return 0;
      }

      let collected = 0;

      for (let attempt = 0; attempt < 10 && collected < amount; attempt++) {
         const blocks = this.bot.findBlocks({
            matching: block.id,
            maxDistance: 48,
            count: 5
         });

         for (const blockPos of blocks) {
            if (collected >= amount) break;

            try {
               await this.bot.pathfinder.goto(new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 3));
               
               const targetBlock = this.bot.blockAt(blockPos);
               if (targetBlock && targetBlock.name === material) {
                  await this.equipBestTool(targetBlock);
                  await this.bot.dig(targetBlock);
                  collected++;
                  await this.bot.waitForTicks(5);
               }
            } catch (error) {
               console.log(`⚠️  Collection error: ${error.message}`);
            }
         }
      }

      return collected;
   }

   async equipBestTool(block) {
      const tools = this.bot.inventory.items();
      let bestTool = null;
      let bestSpeed = 0;

      for (const tool of tools) {
         const digTime = block.digTime(tool);
         if (digTime < 999999 && (1 / digTime) > bestSpeed) {
            bestSpeed = 1 / digTime;
            bestTool = tool;
         }
      }

      if (bestTool) {
         await this.bot.equip(bestTool, 'hand');
      }
   }

   async exploreForOre(oreType) {
      const stripMineY = oreType === 'diamond_ore' ? -59 : 
                        oreType === 'iron_ore' ? 16 : 
                        oreType === 'coal_ore' ? 48 : 0;

      if (stripMineY !== 0) {
         const targetY = stripMineY;
         const currentPos = this.bot.entity.position;
         
         if (Math.abs(currentPos.y - targetY) > 5) {
            await this.descendToLevel(targetY);
         }

         await this.stripMine(32);
      } else {
         await this.randomExplore(30);
      }
   }

   async exploreForResource(resourceType) {
      if (resourceType === 'tree') {
         await this.randomExplore(40);
      } else if (resourceType === 'sand') {
         await this.randomExplore(60);
      } else {
         await this.randomExplore(30);
      }
   }

   async descendToLevel(targetY) {
      const currentY = this.bot.entity.position.y;
      
      if (currentY > targetY) {
         for (let i = 0; i < (currentY - targetY); i++) {
            await this.digDown(1);
         }
      }
   }

   async digDown(depth) {
      for (let i = 0; i < depth; i++) {
         const blockBelow = this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0));
         if (blockBelow && blockBelow.name !== 'air' && blockBelow.name !== 'bedrock') {
            try {
               await this.equipBestTool(blockBelow);
               await this.bot.dig(blockBelow);
               await this.bot.waitForTicks(5);
            } catch (error) {
               break;
            }
         }
      }
   }

   async stripMine(length) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      
      for (let i = 0; i < length; i++) {
         const forward = this.bot.entity.position.offset(direction, 0, 0);
         const blockAhead = this.bot.blockAt(forward);
         
         if (blockAhead && blockAhead.name !== 'air') {
            try {
               await this.equipBestTool(blockAhead);
               await this.bot.dig(blockAhead);
               await this.bot.waitForTicks(3);
            } catch (error) {
               break;
            }
         }
      }
   }

   async randomExplore(distance) {
      const angle = Math.random() * Math.PI * 2;
      const dx = Math.cos(angle) * distance;
      const dz = Math.sin(angle) * distance;
      
      const target = this.bot.entity.position.offset(dx, 0, dz);
      
      try {
         await this.bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 3));
      } catch (error) {
         console.log('⚠️  Exploration blocked');
      }
   }

   countInInventory(itemName) {
      const items = this.bot.inventory.items();
      let count = 0;

      for (const item of items) {
         if (item.name === itemName) {
            count += item.count;
         }
      }

      return count;
   }

   getCollectionStats() {
      return {
         isCollecting: this.isCollecting,
         collected: this.collectedItems,
         queueLength: this.collectionQueue.length
      };
   }

   stop() {
      this.isCollecting = true;
      this.collectionQueue = [];
      console.log('🛑 Auto-collector stopped');
   }
}

module.exports = AutoCollector;
