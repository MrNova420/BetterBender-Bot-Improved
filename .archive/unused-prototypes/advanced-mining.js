const Vec3 = require('vec3');
const { goals } = require('mineflayer-pathfinder');

class AdvancedMining {
   constructor(bot) {
      this.bot = bot;
      this.isMining = false;
      this.miningStats = {
         totalMined: 0,
         oresMined: {},
         depth: 0,
         tunnelsCreated: 0
      };
      this.miningPatterns = {
         strip: this.stripMining.bind(this),
         branch: this.branchMining.bind(this),
         quarry: this.quarryMining.bind(this),
         cave: this.caveMining.bind(this),
         vein: this.veinMining.bind(this)
      };
   }

   async startMining(pattern, options = {}) {
      if (this.isMining) {
         console.log('⚠️  Already mining!');
         return;
      }

      this.isMining = true;
      console.log(`⛏️  Starting ${pattern} mining...`);

      const miningMethod = this.miningPatterns[pattern];
      if (!miningMethod) {
         console.log(`❌ Unknown mining pattern: ${pattern}`);
         this.isMining = false;
         return;
      }

      try {
         await miningMethod(options);
      } catch (error) {
         console.log(`❌ Mining error: ${error.message}`);
      }

      this.isMining = false;
      console.log('✅ Mining completed');
      return this.miningStats;
   }

   async stripMining(options = {}) {
      const depth = options.depth || -59;
      const length = options.length || 100;
      const spacing = options.spacing || 3;

      console.log(`🏗️  Strip mining at Y=${depth}, length=${length}`);

      await this.descendToDepth(depth);

      const startPos = this.bot.entity.position.clone();
      let tunnelCount = 0;

      for (let offset = 0; offset < 50; offset += spacing) {
         await this.mineHorizontalTunnel(length, 0);
         
         tunnelCount++;
         this.miningStats.tunnelsCreated = tunnelCount;

         if (tunnelCount % 2 === 0) {
            await this.returnToStart(startPos);
            await this.moveToNextStrip(offset + spacing);
         } else {
            await this.turnAround();
         }
      }
   }

   async branchMining(options = {}) {
      const depth = options.depth || -59;
      const mainTunnelLength = options.mainLength || 100;
      const branchLength = options.branchLength || 30;
      const branchSpacing = options.branchSpacing || 3;

      console.log(`🌿 Branch mining at Y=${depth}`);

      await this.descendToDepth(depth);

      for (let distance = 0; distance < mainTunnelLength; distance += branchSpacing) {
         await this.mineHorizontalTunnel(branchSpacing, 0);

         await this.turnRight();
         await this.mineHorizontalTunnel(branchLength, 0);
         await this.turnAround();
         await this.mineHorizontalTunnel(branchLength, 0);
         await this.turnRight();

         await this.mineHorizontalTunnel(branchSpacing, 0);

         await this.turnLeft();
         await this.mineHorizontalTunnel(branchLength, 0);
         await this.turnAround();
         await this.mineHorizontalTunnel(branchLength, 0);
         await this.turnLeft();

         this.miningStats.tunnelsCreated += 2;
      }
   }

   async quarryMining(options = {}) {
      const size = options.size || 16;
      const depth = options.depth || 64;

      console.log(`🏗️  Quarry mining ${size}x${size}x${depth}`);

      const startPos = this.bot.entity.position.clone();

      for (let layer = 0; layer < depth; layer++) {
         console.log(`⛏️  Mining layer ${layer + 1}/${depth}`);

         for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
               const targetPos = startPos.offset(x, -layer, z);
               const block = this.bot.blockAt(targetPos);

               if (block && block.name !== 'air' && block.name !== 'bedrock') {
                  try {
                     await this.bot.pathfinder.goto(new goals.GoalNear(targetPos.x, targetPos.y + 1, targetPos.z, 3));
                     await this.equipBestTool(block);
                     await this.bot.dig(block);
                     this.miningStats.totalMined++;
                     
                     if (this.isOre(block.name)) {
                        this.recordOre(block.name);
                     }
                  } catch (error) {
                     console.log(`⚠️  Skip block at ${targetPos}: ${error.message}`);
                  }
               }
            }
         }
      }
   }

   async caveMining(options = {}) {
      const duration = options.duration || 300000;
      const startTime = Date.now();

      console.log(`🕳️  Cave mining for ${duration / 1000} seconds`);

      while (Date.now() - startTime < duration && this.isMining) {
         const nearbyOres = await this.findNearbyOres(32);

         if (nearbyOres.length > 0) {
            for (const orePos of nearbyOres) {
               await this.mineOreVein(orePos);
            }
         } else {
            await this.exploreCave();
         }

         await this.bot.waitForTicks(20);
      }
   }

   async veinMining(options = {}) {
      const oreType = options.oreType || 'iron_ore';
      const maxVeinSize = options.maxVeinSize || 50;

      console.log(`💎 Vein mining ${oreType}`);

      const nearbyOres = await this.findNearbyOres(64, oreType);

      for (const orePos of nearbyOres) {
         await this.mineOreVein(orePos, oreType, maxVeinSize);
      }
   }

   async mineOreVein(startPos, oreType = null, maxBlocks = 50) {
      const visited = new Set();
      const queue = [startPos];
      let minedCount = 0;

      while (queue.length > 0 && minedCount < maxBlocks) {
         const pos = queue.shift();
         const key = `${pos.x},${pos.y},${pos.z}`;

         if (visited.has(key)) continue;
         visited.add(key);

         const block = this.bot.blockAt(pos);
         if (!block) continue;

         if (this.isOre(block.name) && (!oreType || block.name === oreType)) {
            try {
               await this.bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 3));
               await this.equipBestTool(block);
               await this.bot.dig(block);
               
               minedCount++;
               this.recordOre(block.name);
               console.log(`💎 Mined ${block.name} (${minedCount})`);

               const neighbors = [
                  pos.offset(1, 0, 0), pos.offset(-1, 0, 0),
                  pos.offset(0, 1, 0), pos.offset(0, -1, 0),
                  pos.offset(0, 0, 1), pos.offset(0, 0, -1)
               ];

               for (const neighbor of neighbors) {
                  const neighborKey = `${neighbor.x},${neighbor.y},${neighbor.z}`;
                  if (!visited.has(neighborKey)) {
                     queue.push(neighbor);
                  }
               }
            } catch (error) {
               console.log(`⚠️  Vein mining error: ${error.message}`);
            }
         }
      }

      return minedCount;
   }

   async mineHorizontalTunnel(length, yOffset = 0) {
      const startPos = this.bot.entity.position.clone();
      const direction = this.getForwardVector();

      for (let i = 0; i < length; i++) {
         const targetPos = startPos.offset(
            direction.x * i,
            yOffset,
            direction.z * i
         );

         const blocksToMine = [
            this.bot.blockAt(targetPos),
            this.bot.blockAt(targetPos.offset(0, 1, 0)),
            this.bot.blockAt(targetPos.offset(0, 2, 0))
         ];

         for (const block of blocksToMine) {
            if (block && block.name !== 'air' && block.name !== 'bedrock') {
               try {
                  await this.equipBestTool(block);
                  await this.bot.dig(block);
                  this.miningStats.totalMined++;
                  
                  if (this.isOre(block.name)) {
                     this.recordOre(block.name);
                     await this.mineOreVein(block.position);
                  }
               } catch (error) {
                  console.log(`⚠️  Mining error: ${error.message}`);
               }
            }
         }

         await this.bot.pathfinder.goto(new goals.GoalBlock(targetPos.x, targetPos.y, targetPos.z));
      }
   }

   async descendToDepth(targetY) {
      const currentY = this.bot.entity.position.y;
      console.log(`⬇️  Descending from Y=${Math.floor(currentY)} to Y=${targetY}`);

      while (this.bot.entity.position.y > targetY + 1) {
         const blockBelow = this.bot.blockAt(this.bot.entity.position.offset(0, -1, 0));
         
         if (blockBelow && blockBelow.name !== 'air' && blockBelow.name !== 'bedrock') {
            try {
               await this.equipBestTool(blockBelow);
               await this.bot.dig(blockBelow);
               await this.bot.waitForTicks(5);
            } catch (error) {
               console.log(`⚠️  Descent blocked: ${error.message}`);
               break;
            }
         } else {
            break;
         }

         if (this.bot.entity.position.y < targetY + 1) break;
      }

      this.miningStats.depth = Math.floor(this.bot.entity.position.y);
   }

   async findNearbyOres(radius = 32, oreType = null) {
      const mcData = require('minecraft-data')(this.bot.version);
      const oreTypes = oreType ? [oreType] : [
         'coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore',
         'emerald_ore', 'lapis_ore', 'redstone_ore', 'copper_ore',
         'deepslate_coal_ore', 'deepslate_iron_ore', 'deepslate_gold_ore',
         'deepslate_diamond_ore', 'deepslate_emerald_ore', 'deepslate_lapis_ore',
         'deepslate_redstone_ore', 'deepslate_copper_ore'
      ];

      const orePositions = [];

      for (const ore of oreTypes) {
         const oreBlock = mcData.blocksByName[ore];
         if (!oreBlock) continue;

         const blocks = this.bot.findBlocks({
            matching: oreBlock.id,
            maxDistance: radius,
            count: 100
         });

         orePositions.push(...blocks);
      }

      return orePositions;
   }

   async exploreCave() {
      const nearbyBlocks = this.bot.findBlocks({
         matching: (block) => block.name === 'air',
         maxDistance: 16,
         count: 50
      });

      if (nearbyBlocks.length > 0) {
         const randomBlock = nearbyBlocks[Math.floor(Math.random() * nearbyBlocks.length)];
         try {
            await this.bot.pathfinder.goto(new goals.GoalNear(randomBlock.x, randomBlock.y, randomBlock.z, 2));
         } catch (error) {
            console.log('⚠️  Cave exploration blocked');
         }
      }
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

   getForwardVector() {
      const yaw = this.bot.entity.yaw;
      return {
         x: -Math.sin(yaw),
         z: -Math.cos(yaw)
      };
   }

   async turnRight() {
      await this.bot.look(this.bot.entity.yaw - Math.PI / 2, 0);
   }

   async turnLeft() {
      await this.bot.look(this.bot.entity.yaw + Math.PI / 2, 0);
   }

   async turnAround() {
      await this.bot.look(this.bot.entity.yaw + Math.PI, 0);
   }

   async returnToStart(startPos) {
      try {
         await this.bot.pathfinder.goto(new goals.GoalBlock(startPos.x, startPos.y, startPos.z));
      } catch (error) {
         console.log('⚠️  Return to start failed');
      }
   }

   async moveToNextStrip(distance) {
      const direction = this.getForwardVector();
      const perpendicular = { x: -direction.z, z: direction.x };
      
      for (let i = 0; i < distance; i++) {
         const targetPos = this.bot.entity.position.offset(perpendicular.x, 0, perpendicular.z);
         const block = this.bot.blockAt(targetPos);
         
         if (block && block.name !== 'air') {
            try {
               await this.equipBestTool(block);
               await this.bot.dig(block);
            } catch (error) {
               break;
            }
         }
      }
   }

   isOre(blockName) {
      const oreTypes = [
         'coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore', 'emerald_ore',
         'lapis_ore', 'redstone_ore', 'copper_ore', 'nether_quartz_ore',
         'nether_gold_ore', 'ancient_debris', 'deepslate_coal_ore',
         'deepslate_iron_ore', 'deepslate_gold_ore', 'deepslate_diamond_ore',
         'deepslate_emerald_ore', 'deepslate_lapis_ore', 'deepslate_redstone_ore',
         'deepslate_copper_ore'
      ];
      return oreTypes.includes(blockName);
   }

   recordOre(oreName) {
      this.miningStats.oresMined[oreName] = (this.miningStats.oresMined[oreName] || 0) + 1;
      console.log(`💎 Found ${oreName}! Total: ${this.miningStats.oresMined[oreName]}`);
   }

   getStats() {
      return this.miningStats;
   }

   stop() {
      this.isMining = false;
      console.log('🛑 Mining stopped');
   }
}

module.exports = AdvancedMining;
