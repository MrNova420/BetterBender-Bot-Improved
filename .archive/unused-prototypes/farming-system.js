const Vec3 = require('vec3');
const { goals } = require('mineflayer-pathfinder');

class FarmingSystem {
   constructor(bot) {
      this.bot = bot;
      this.farms = [];
      this.isFarming = false;
      this.harvestStats = {
         wheat: 0,
         carrots: 0,
         potatoes: 0,
         beetroot: 0,
         total: 0
      };
   }

   async createFarm(x, y, z, size = 9) {
      console.log(`🌾 Creating ${size}x${size} farm at ${x}, ${y}, ${z}`);

      const farm = {
         position: new Vec3(x, y, z),
         size: size,
         cropType: 'wheat',
         planted: false,
         hydrated: false
      };

      await this.prepareFarmland(farm);
      await this.addWaterSource(farm);
      await this.plantCrops(farm);

      this.farms.push(farm);
      console.log('✅ Farm created successfully');
      return farm;
   }

   async prepareFarmland(farm) {
      const { position, size } = farm;
      const mcData = require('minecraft-data')(this.bot.version);
      const hoeItem = this.bot.inventory.items().find(item => item.name.includes('_hoe'));

      console.log('🔨 Preparing farmland...');

      for (let x = 0; x < size; x++) {
         for (let z = 0; z < size; z++) {
            const blockPos = position.offset(x, 0, z);
            const block = this.bot.blockAt(blockPos);

            if (block && (block.name === 'grass_block' || block.name === 'dirt')) {
               try {
                  await this.bot.pathfinder.goto(new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 3));
                  
                  if (hoeItem) {
                     await this.bot.equip(hoeItem, 'hand');
                  }
                  
                  await this.bot.activateBlock(block);
                  await this.bot.waitForTicks(2);
               } catch (error) {
                  console.log(`⚠️  Failed to till ${blockPos}: ${error.message}`);
               }
            }
         }
      }
   }

   async addWaterSource(farm) {
      const { position, size } = farm;
      const centerX = Math.floor(size / 2);
      const centerZ = Math.floor(size / 2);
      const waterPos = position.offset(centerX, 0, centerZ);

      console.log('💧 Adding water source...');

      try {
         const block = this.bot.blockAt(waterPos);
         if (block) {
            await this.bot.dig(block);
         }

         const waterBucket = this.bot.inventory.items().find(item => item.name === 'water_bucket');
         if (waterBucket) {
            await this.bot.equip(waterBucket, 'hand');
            await this.bot.pathfinder.goto(new goals.GoalNear(waterPos.x, waterPos.y, waterPos.z, 3));
            
            const blockBelow = this.bot.blockAt(waterPos.offset(0, -1, 0));
            await this.bot.activateBlock(blockBelow);
            farm.hydrated = true;
         }
      } catch (error) {
         console.log(`⚠️  Water placement failed: ${error.message}`);
      }
   }

   async plantCrops(farm) {
      const { position, size } = farm;
      console.log('🌱 Planting crops...');

      const seeds = this.bot.inventory.items().find(item => 
         item.name === 'wheat_seeds' || item.name === 'carrot' || 
         item.name === 'potato' || item.name === 'beetroot_seeds'
      );

      if (!seeds) {
         console.log('⚠️  No seeds available');
         return;
      }

      farm.cropType = seeds.name.replace('_seeds', '');

      for (let x = 0; x < size; x++) {
         for (let z = 0; z < size; z++) {
            const blockPos = position.offset(x, 0, z);
            const block = this.bot.blockAt(blockPos);

            if (block && block.name === 'farmland') {
               try {
                  await this.bot.equip(seeds, 'hand');
                  await this.bot.pathfinder.goto(new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 3));
                  
                  const blockAbove = this.bot.blockAt(blockPos.offset(0, 1, 0));
                  if (blockAbove && blockAbove.name === 'air') {
                     await this.bot.placeBlock(block, new Vec3(0, 1, 0));
                     await this.bot.waitForTicks(2);
                  }
               } catch (error) {
                  console.log(`⚠️  Planting failed at ${blockPos}: ${error.message}`);
               }
            }
         }
      }

      farm.planted = true;
   }

   async harvestFarm(farmIndex = 0) {
      if (farmIndex >= this.farms.length) {
         console.log('⚠️  Invalid farm index');
         return;
      }

      const farm = this.farms[farmIndex];
      console.log(`🌾 Harvesting farm ${farmIndex + 1}...`);

      const { position, size, cropType } = farm;
      let harvested = 0;

      for (let x = 0; x < size; x++) {
         for (let z = 0; z < size; z++) {
            const blockPos = position.offset(x, 1, z);
            const block = this.bot.blockAt(blockPos);

            if (block && this.isMatureCrop(block)) {
               try {
                  await this.bot.pathfinder.goto(new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 3));
                  await this.bot.dig(block);
                  harvested++;
                  this.recordHarvest(block.name);
                  await this.bot.waitForTicks(2);
               } catch (error) {
                  console.log(`⚠️  Harvest failed: ${error.message}`);
               }
            }
         }
      }

      console.log(`✅ Harvested ${harvested} crops`);
      
      await this.replantFarm(farm);
      
      return harvested;
   }

   async replantFarm(farm) {
      console.log('🌱 Replanting...');
      await this.plantCrops(farm);
   }

   async harvestAllFarms() {
      console.log('🌾 Harvesting all farms...');
      let totalHarvested = 0;

      for (let i = 0; i < this.farms.length; i++) {
         const harvested = await this.harvestFarm(i);
         totalHarvested += harvested;
      }

      console.log(`✅ Total harvested: ${totalHarvested}`);
      return totalHarvested;
   }

   async autoFarm(duration = 600000) {
      console.log(`🤖 Auto-farming for ${duration / 1000} seconds`);
      this.isFarming = true;
      const startTime = Date.now();

      while (Date.now() - startTime < duration && this.isFarming) {
         for (let i = 0; i < this.farms.length; i++) {
            const farm = this.farms[i];
            const hasMatureCrops = await this.checkMatureCrops(farm);

            if (hasMatureCrops) {
               await this.harvestFarm(i);
            }
         }

         await this.bot.waitForTicks(600);
      }

      this.isFarming = false;
      console.log('✅ Auto-farming completed');
   }

   async checkMatureCrops(farm) {
      const { position, size } = farm;

      for (let x = 0; x < size; x++) {
         for (let z = 0; z < size; z++) {
            const blockPos = position.offset(x, 1, z);
            const block = this.bot.blockAt(blockPos);

            if (block && this.isMatureCrop(block)) {
               return true;
            }
         }
      }

      return false;
   }

   isMatureCrop(block) {
      const matureCrops = [
         'wheat', 'carrots', 'potatoes', 'beetroots'
      ];

      if (!matureCrops.some(crop => block.name === crop)) {
         return false;
      }

      const metadata = block.metadata || 0;
      return metadata === 7;
   }

   recordHarvest(cropName) {
      const cropType = cropName.replace('s', '');
      
      if (this.harvestStats[cropType] !== undefined) {
         this.harvestStats[cropType]++;
      }
      
      this.harvestStats.total++;
   }

   async breedAnimals(animalType, count = 5) {
      console.log(`🐄 Breeding ${count} ${animalType}...`);

      const nearbyAnimals = Object.values(this.bot.entities).filter(entity => 
         entity.name === animalType && 
         entity.position.distanceTo(this.bot.entity.position) < 16
      );

      if (nearbyAnimals.length < 2) {
         console.log('⚠️  Not enough animals nearby');
         return;
      }

      const breedingItem = this.getBreedingItem(animalType);
      const item = this.bot.inventory.items().find(i => i.name === breedingItem);

      if (!item) {
         console.log(`⚠️  No ${breedingItem} for breeding`);
         return;
      }

      let bred = 0;

      for (let i = 0; i < nearbyAnimals.length - 1 && bred < count; i += 2) {
         const animal1 = nearbyAnimals[i];
         const animal2 = nearbyAnimals[i + 1];

         try {
            await this.bot.equip(item, 'hand');
            await this.bot.pathfinder.goto(new goals.GoalNear(animal1.position.x, animal1.position.y, animal1.position.z, 2));
            await this.bot.activateEntity(animal1);
            
            await this.bot.pathfinder.goto(new goals.GoalNear(animal2.position.x, animal2.position.y, animal2.position.z, 2));
            await this.bot.activateEntity(animal2);

            bred++;
            console.log(`✅ Bred ${animalType} (${bred}/${count})`);
            await this.bot.waitForTicks(100);
         } catch (error) {
            console.log(`⚠️  Breeding failed: ${error.message}`);
         }
      }

      return bred;
   }

   getBreedingItem(animalType) {
      const breedingMap = {
         'cow': 'wheat',
         'sheep': 'wheat',
         'pig': 'carrot',
         'chicken': 'wheat_seeds',
         'rabbit': 'carrot',
         'horse': 'golden_carrot'
      };

      return breedingMap[animalType] || 'wheat';
   }

   getStats() {
      return {
         farms: this.farms.length,
         harvested: this.harvestStats,
         isFarming: this.isFarming
      };
   }

   stop() {
      this.isFarming = false;
      console.log('🛑 Farming stopped');
   }
}

module.exports = FarmingSystem;
