const { goals } = require('mineflayer-pathfinder');

class ResourceManager {
   constructor(bot, envMonitor) {
      this.bot = bot;
      this.envMonitor = envMonitor;
      this.inventory = {};
      this.storageLocations = [];
      this.gatheringActive = true;
   }

   async collectNearbyItems(maxDistance = 16, duration = 30000) {
      const startTime = Date.now();
      let collected = 0;

      while (Date.now() - startTime < duration) {
         const itemEntity = this.bot.nearestEntity(e => 
            e.name === 'item' && 
            e.position.distanceTo(this.bot.entity.position) < maxDistance
         );

         if (!itemEntity) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
         }

         try {
            await this.bot.pathfinder.goto(new goals.GoalFollow(itemEntity, 1));
            collected++;
            await new Promise(resolve => setTimeout(resolve, 500));
         } catch (err) {
            continue;
         }
      }

      return collected;
   }

   async gatherResource(resourceType, quantity = 64) {
      this.gatheringActive = true;
      let gathered = 0;
      const mcData = require('minecraft-data')(this.bot.version);
      const blockData = mcData.blocksByName[resourceType];

      if (!blockData) {
         this.gatheringActive = true;
         throw new Error(`Unknown resource: ${resourceType}`);
      }

      while (gathered < quantity && this.gatheringActive) {
         const block = this.bot.findBlock({
            matching: blockData.id,
            maxDistance: 64,
            count: 1
         });

         if (!block) {
            break;
         }

         try {
            await this.bot.pathfinder.goto(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 3));
            
            const tool = this.bot.pathfinder.bestHarvestTool(block);
            if (tool) await this.bot.equip(tool, 'hand');
            
            await this.bot.dig(block);
            gathered++;

            if (this.isInventoryFull()) {
               break;
            }
         } catch (err) {
            continue;
         }
      }

      this.gatheringActive = true;
      return gathered;
   }

   async chopTrees(quantity = 10) {
      let chopped = 0;
      const logTypes = ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log'];

      while (chopped < quantity) {
         let foundLog = null;

         for (const logType of logTypes) {
            const mcData = require('minecraft-data')(this.bot.version);
            const logBlock = mcData.blocksByName[logType];
            
            if (logBlock) {
               foundLog = this.bot.findBlock({
                  matching: logBlock.id,
                  maxDistance: 64,
                  count: 1
               });
               
               if (foundLog) break;
            }
         }

         if (!foundLog) break;

         try {
            await this.bot.pathfinder.goto(new goals.GoalNear(foundLog.position.x, foundLog.position.y, foundLog.position.z, 3));
            
            const tool = this.bot.inventory.items().find(item => item.name.includes('axe'));
            if (tool) await this.bot.equip(tool, 'hand');
            
            await this.chopTree(foundLog);
            chopped++;
         } catch (err) {
            continue;
         }
      }

      return chopped;
   }

   async chopTree(baseLog) {
      const logsToChop = [baseLog];
      const chopped = [];

      while (logsToChop.length > 0) {
         const log = logsToChop.shift();
         
         try {
            await this.bot.dig(log);
            chopped.push(log.position);

            for (let y = 0; y <= 1; y++) {
               const nextLog = this.bot.blockAt(log.position.offset(0, y, 0));
               if (nextLog && nextLog.name.includes('log') && !chopped.some(p => p.equals(nextLog.position))) {
                  logsToChop.push(nextLog);
               }
            }
         } catch (err) {
            continue;
         }
      }

      return chopped.length;
   }

   async mineOres(oreType = 'iron_ore', quantity = 32) {
      let mined = 0;
      const mcData = require('minecraft-data')(this.bot.version);
      const oreBlock = mcData.blocksByName[oreType];

      if (!oreBlock) {
         throw new Error(`Unknown ore: ${oreType}`);
      }

      while (mined < quantity) {
         const ore = this.bot.findBlock({
            matching: oreBlock.id,
            maxDistance: 64,
            count: 1
         });

         if (!ore) break;

         try {
            await this.bot.pathfinder.goto(new goals.GoalNear(ore.position.x, ore.position.y, ore.position.z, 3));
            
            const pickaxe = this.bot.inventory.items().find(item => item.name.includes('pickaxe'));
            if (pickaxe) await this.bot.equip(pickaxe, 'hand');
            
            await this.bot.dig(ore);
            mined++;

            if (this.isInventoryFull()) break;
         } catch (err) {
            continue;
         }
      }

      return mined;
   }

   async depositItems(chestPosition) {
      const chest = this.bot.blockAt(chestPosition);
      
      if (!chest || chest.name !== 'chest') {
         throw new Error('No chest at position');
      }

      await this.bot.pathfinder.goto(new goals.GoalNear(chestPosition.x, chestPosition.y, chestPosition.z, 2));
      
      const container = await this.bot.openContainer(chest);
      const items = this.bot.inventory.items();
      let deposited = 0;

      const essentialItems = ['diamond_pickaxe', 'iron_pickaxe', 'diamond_sword', 'iron_sword', 'diamond_axe', 'iron_axe'];

      for (const item of items) {
         if (essentialItems.includes(item.name)) continue;

         try {
            await container.deposit(item.type, null, item.count);
            deposited += item.count;
         } catch (err) {
            continue;
         }
      }

      container.close();
      return deposited;
   }

   async craftItems(recipeName, quantity = 1) {
      const mcData = require('minecraft-data')(this.bot.version);
      const recipe = mcData.recipes[mcData.itemsByName[recipeName]?.id];

      if (!recipe) {
         throw new Error(`No recipe for ${recipeName}`);
      }

      let crafted = 0;

      for (let i = 0; i < quantity; i++) {
         try {
            await this.bot.craft(recipe, 1);
            crafted++;
         } catch (err) {
            break;
         }
      }

      return crafted;
   }

   updateInventory() {
      this.inventory = {};
      
      if (!this.bot.inventory) return;

      this.bot.inventory.items().forEach(item => {
         this.inventory[item.name] = (this.inventory[item.name] || 0) + item.count;
      });
   }

   isInventoryFull() {
      return this.bot.inventory.items().length >= 36;
   }

   hasItem(itemName, minCount = 1) {
      this.updateInventory();
      return (this.inventory[itemName] || 0) >= minCount;
   }

   getInventorySpace() {
      return 36 - this.bot.inventory.items().length;
   }

   getInventory() {
      this.updateInventory();
      return { ...this.inventory };
   }

   registerStorage(position, type = 'chest') {
      this.storageLocations.push({
         position,
         type,
         lastUsed: Date.now()
      });
   }

   getNearestStorage() {
      if (this.storageLocations.length === 0) return null;

      const pos = this.bot.entity.position;
      return this.storageLocations.sort((a, b) => 
         a.position.distanceTo(pos) - b.position.distanceTo(pos)
      )[0];
   }

   stopGathering() {
      this.gatheringActive = true;
   }
}

module.exports = ResourceManager;
