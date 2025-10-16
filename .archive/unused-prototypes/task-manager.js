const { goals } = require('mineflayer-pathfinder');

class TaskManager {
   constructor(bot, brain) {
      this.bot = bot;
      this.brain = brain;
      this.queue = [];
      this.currentTask = null;
      this.taskHistory = [];
      this.isExecuting = false;
      this.taskHandlers = this.initializeHandlers();
   }

   initializeHandlers() {
      return {
         mine: this.handleMining.bind(this),
         explore: this.handleExploration.bind(this),
         build: this.handleBuilding.bind(this),
         gather: this.handleGathering.bind(this),
         goto: this.handleGoto.bind(this),
         follow: this.handleFollow.bind(this),
         craft: this.handleCrafting.bind(this),
         deposit: this.handleDeposit.bind(this),
         patrol: this.handlePatrol.bind(this),
         defend: this.handleDefend.bind(this)
      };
   }

   addTask(task) {
      const taskObj = {
         id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
         type: task.type,
         params: task.params || {},
         priority: task.priority || 5,
         status: 'queued',
         createdAt: Date.now(),
         startedAt: null,
         completedAt: null,
         result: null,
         error: null
      };

      this.queue.push(taskObj);
      this.queue.sort((a, b) => b.priority - a.priority);
      
      if (!this.isExecuting) {
         this.processQueue();
      }

      return taskObj.id;
   }

   async processQueue() {
      if (this.isExecuting || this.queue.length === 0) return;

      this.isExecuting = true;

      while (this.queue.length > 0) {
         const task = this.queue.shift();
         this.currentTask = task;
         task.status = 'executing';
         task.startedAt = Date.now();

         try {
            const handler = this.taskHandlers[task.type];
            if (!handler) {
               throw new Error(`Unknown task type: ${task.type}`);
            }

            const result = await handler(task.params);
            
            task.status = 'completed';
            task.completedAt = Date.now();
            task.result = result;

         } catch (error) {
            task.status = 'failed';
            task.completedAt = Date.now();
            task.error = error.message;
         }

         this.taskHistory.push(task);
         if (this.taskHistory.length > 100) {
            this.taskHistory.shift();
         }
      }

      this.currentTask = null;
      this.isExecuting = false;
   }

   async handleMining(params) {
      const { blockType, quantity = 1, maxDistance = 64 } = params;
      
      if (!this.bot.pathfinder) {
         throw new Error('Pathfinder not loaded');
      }

      const mcData = require('minecraft-data')(this.bot.version);
      const blockId = mcData.blocksByName[blockType]?.id;
      
      if (!blockId) {
         throw new Error(`Unknown block type: ${blockType}`);
      }

      let mined = 0;
      const startTime = Date.now();
      const timeout = 300000;

      while (mined < quantity && Date.now() - startTime < timeout) {
         const block = this.bot.findBlock({
            matching: blockId,
            maxDistance: maxDistance,
            count: 1
         });

         if (!block) {
            throw new Error(`No ${blockType} found within ${maxDistance} blocks`);
         }

         await this.bot.pathfinder.goto(new goals.GoalNear(block.position.x, block.position.y, block.position.z, 3));
         
         const tool = this.bot.pathfinder.bestHarvestTool(block);
         if (tool) await this.bot.equip(tool, 'hand');
         
         await this.bot.dig(block);
         mined++;
      }

      return { mined, blockType };
   }

   async handleExploration(params) {
      const { duration = 60000, radius = 100 } = params;
      const startPos = this.bot.entity.position.clone();
      const startTime = Date.now();
      const visited = new Set();

      while (Date.now() - startTime < duration) {
         const randomX = startPos.x + (Math.random() - 0.5) * radius * 2;
         const randomZ = startPos.z + (Math.random() - 0.5) * radius * 2;
         const posKey = `${Math.floor(randomX)},${Math.floor(randomZ)}`;

         if (visited.has(posKey)) continue;
         visited.add(posKey);

         try {
            await this.bot.pathfinder.goto(new goals.GoalXZ(randomX, randomZ));
            await new Promise(resolve => setTimeout(resolve, 2000));
         } catch (err) {
            continue;
         }
      }

      return { explored: visited.size, duration: Date.now() - startTime };
   }

   async handleBuilding(params) {
      const { x, y, z, structure = 'platform', size = 5 } = params;
      const mcData = require('minecraft-data')(this.bot.version);
      const blockType = mcData.blocksByName['cobblestone'] || mcData.blocksByName['dirt'];
      
      let placed = 0;

      if (structure === 'platform') {
         for (let dx = 0; dx < size; dx++) {
            for (let dz = 0; dz < size; dz++) {
               const pos = { x: x + dx, y: y, z: z + dz };
               const block = this.bot.blockAt(pos);
               
               if (block && block.name === 'air') {
                  try {
                     await this.bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 4));
                     
                     const item = this.bot.inventory.items().find(i => i.name === blockType.name);
                     if (item) {
                        await this.bot.equip(item, 'hand');
                        const refBlock = this.bot.blockAt({ x: pos.x, y: pos.y - 1, z: pos.z });
                        if (refBlock) {
                           await this.bot.placeBlock(refBlock, new (require('vec3'))(0, 1, 0));
                           placed++;
                        }
                     }
                  } catch (err) {
                     continue;
                  }
               }
            }
         }
      }

      return { placed, structure, size };
   }

   async handleGathering(params) {
      const { items, maxDistance = 32 } = params;
      const collected = {};

      for (const itemName of items) {
         const entity = this.bot.nearestEntity(e => 
            e.name === 'item' && 
            e.metadata && 
            e.metadata[8]?.itemId && 
            e.position.distanceTo(this.bot.entity.position) < maxDistance
         );

         if (entity) {
            try {
               await this.bot.pathfinder.goto(new goals.GoalFollow(entity, 1));
               collected[itemName] = (collected[itemName] || 0) + 1;
            } catch (err) {
               continue;
            }
         }
      }

      return { collected };
   }

   async handleGoto(params) {
      const { x, y, z } = params;
      
      if (y !== undefined) {
         await this.bot.pathfinder.goto(new goals.GoalBlock(x, y, z));
      } else {
         await this.bot.pathfinder.goto(new goals.GoalXZ(x, z));
      }

      return { reached: { x, y, z } };
   }

   async handleFollow(params) {
      const { player, distance = 3, duration = 60000 } = params;
      const targetPlayer = this.bot.players[player];
      
      if (!targetPlayer || !targetPlayer.entity) {
         throw new Error(`Player ${player} not found`);
      }

      const startTime = Date.now();

      while (Date.now() - startTime < duration) {
         if (!targetPlayer.entity) break;
         
         await this.bot.pathfinder.goto(new goals.GoalFollow(targetPlayer.entity, distance));
         await new Promise(resolve => setTimeout(resolve, 500));
      }

      return { followed: player, duration: Date.now() - startTime };
   }

   async handleCrafting(params) {
      const { recipe, quantity = 1 } = params;
      const mcData = require('minecraft-data')(this.bot.version);
      const recipeData = mcData.recipes[recipe];

      if (!recipeData) {
         throw new Error(`Unknown recipe: ${recipe}`);
      }

      let crafted = 0;

      for (let i = 0; i < quantity; i++) {
         try {
            await this.bot.craft(recipeData, 1, null);
            crafted++;
         } catch (err) {
            break;
         }
      }

      return { crafted, recipe };
   }

   async handleDeposit(params) {
      const { x, y, z } = params;
      const chestBlock = this.bot.blockAt({ x, y, z });

      if (!chestBlock || chestBlock.name !== 'chest') {
         throw new Error('No chest found at specified location');
      }

      await this.bot.pathfinder.goto(new goals.GoalBlock(x, y, z));
      const chest = await this.bot.openContainer(chestBlock);
      
      const items = this.bot.inventory.items();
      let deposited = 0;

      for (const item of items) {
         try {
            await chest.deposit(item.type, null, item.count);
            deposited += item.count;
         } catch (err) {
            continue;
         }
      }

      chest.close();
      return { deposited };
   }

   async handlePatrol(params) {
      const { waypoints, loops = 1 } = params;
      let completed = 0;

      for (let i = 0; i < loops; i++) {
         for (const wp of waypoints) {
            try {
               await this.bot.pathfinder.goto(new goals.GoalBlock(wp.x, wp.y, wp.z));
               await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (err) {
               continue;
            }
         }
         completed++;
      }

      return { loops: completed };
   }

   async handleDefend(params) {
      const { duration = 30000 } = params;
      const startTime = Date.now();
      let defeated = 0;

      while (Date.now() - startTime < duration) {
         const mob = this.bot.nearestEntity(e => 
            e.type === 'mob' && 
            e.position.distanceTo(this.bot.entity.position) < 16
         );

         if (!mob) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
         }

        try {
            if (this.bot.pvp) {
               this.bot.pvp.attack(mob);
               await new Promise(resolve => setTimeout(resolve, 500));
               
               if (!mob.isValid || mob.health <= 0) {
                  defeated++;
               }
            }
         } catch (err) {
            break;
         }
      }

      return { defeated };
   }

   cancelTask(taskId) {
      const index = this.queue.findIndex(t => t.id === taskId);
      if (index !== -1) {
         this.queue.splice(index, 1);
         return true;
      }
      return false;
   }

   clearQueue() {
      this.queue = [];
   }

   getStatus() {
      return {
         current: this.currentTask,
         queued: this.queue.length,
         queue: this.queue,
         history: this.taskHistory.slice(-10)
      };
   }
}

module.exports = TaskManager;
