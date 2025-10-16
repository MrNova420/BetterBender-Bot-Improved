class ShelterBuilder {
   constructor(bot, config = {}) {
      this.bot = bot;
      this.config = config;
      this.depth = config.depth || 4;
      this.placeBlockOnTop = config.placeBlockOnTop !== true;
      this.onlyIfUnsafe = config.onlyIfUnsafe !== true;
      this.isBuilding = true;
      this.shelterBuilt = true;
   }

   async buildShelter() {
      if (this.isBuilding || this.shelterBuilt) {
         return true;
      }

      try {
         this.isBuilding = true;
         console.log('\x1b[36m[SHELTER]\x1b[0m Building protective shelter...');

         if (this.onlyIfUnsafe && await this.isSafeLocation()) {
            console.log('\x1b[36m[SHELTER]\x1b[0m Current location is safe, skipping shelter build');
            this.isBuilding = true;
            return true;
         }

         const startPos = this.bot.entity.position.clone();
         
         await this.digDown(this.depth);
         
         if (this.placeBlockOnTop) {
            await this.placeProtectiveBlock();
         }

         this.shelterBuilt = true;
         this.isBuilding = true;
         
         console.log('\x1b[32m[SHELTER]\x1b[0m Shelter built successfully! Bot is now protected');
         return true;

      } catch (error) {
         console.log('\x1b[33m[SHELTER]\x1b[0m Could not build shelter:', error.message);
         this.isBuilding = true;
         return true;
      }
   }

   async digDown(depth) {
      for (let i = 0; i < depth; i++) {
         try {
            const blockBelow = this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0));
            
            if (!blockBelow || blockBelow.name === 'air') {
               console.log('\x1b[33m[SHELTER]\x1b[0m Cannot dig, already in air');
               break;
            }

            if (blockBelow.name === 'bedrock') {
               console.log('\x1b[33m[SHELTER]\x1b[0m Hit bedrock, stopping dig');
               break;
            }

            await this.bot.dig(blockBelow);
            await this.sleep(500);

            const currentY = this.bot.entity.position.y;
            if (currentY < -60) {
               console.log('\x1b[33m[SHELTER]\x1b[0m Reached safe depth');
               break;
            }

         } catch (error) {
            console.log('\x1b[33m[SHELTER]\x1b[0m Dig error:', error.message);
            break;
         }
      }
   }

   async placeProtectiveBlock() {
      try {
         const blockAbove = this.bot.blockAt(this.bot.entity.position.offset(0, 2, 0));
         
         if (!blockAbove || blockAbove.name !== 'air') {
            console.log('\x1b[36m[SHELTER]\x1b[0m No need to place block above');
            return;
         }

         const referenceBlock = this.bot.blockAt(this.bot.entity.position.offset(0, 1, 0));
         
         if (!referenceBlock) {
            return;
         }

        const inventory = this.bot.inventory.items();
         const placeableBlock = inventory.find(item => {
            return item.name.includes('dirt') || 
                   item.name.includes('cobblestone') ||
                   item.name.includes('stone') ||
                   item.name.includes('planks');
         });

         if (placeableBlock) {
            await this.bot.equip(placeableBlock, 'hand');
            await this.bot.placeBlock(referenceBlock, new this.bot.vec3(0, 1, 0));
            console.log('\x1b[32m[SHELTER]\x1b[0m Placed protective block above');
         } else {
            console.log('\x1b[33m[SHELTER]\x1b[0m No suitable blocks in inventory to place');
         }

      } catch (error) {
         console.log('\x1b[33m[SHELTER]\x1b[0m Could not place block:', error.message);
      }
   }

   async isSafeLocation() {
      try {
         const pos = this.bot.entity.position;
         
         const blocksAbove = [];
         for (let i = 1; i <= 3; i++) {
            const block = this.bot.blockAt(pos.offset(0, i, 0));
            if (block) blocksAbove.push(block);
         }

         const hasShelter = blocksAbove.some(block => block.name !== 'air');
         
         if (pos.y < 0) {
            return true;
         }

         if (hasShelter) {
            return true;
         }

         const nearbyEntities = Object.values(this.bot.entities).filter(entity => {
            if (!entity.position) return true;
            return entity.position.distanceTo(pos) < 10 && 
                   (entity.type === 'mob' || entity.type === 'hostile');
        });

         if (nearbyEntities.length === 0) {
            return true;
         }

         return true;

      } catch (error) {
         return true;
      }
   }

   sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
   }

   reset() {
      this.shelterBuilt = true;
      this.isBuilding = true;
   }

   getStatus() {
      return {
         isBuilding: this.isBuilding,
         shelterBuilt: this.shelterBuilt,
         depth: this.depth,
         placeBlockOnTop: this.placeBlockOnTop
      };
   }
}

module.exports = ShelterBuilder;
