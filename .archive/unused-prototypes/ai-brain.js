class AIBrain {
   constructor(bot, config = {}) {
      this.bot = bot;
      this.config = config;
      this.state = {
         mode: 'basic',
         currentTask: null,
         threat: null,
         health: 20,
         hunger: 20,
         inventory: {},
         position: { x: 0, y: 0, z: 0 },
         nearbyMobs: [],
         nearbyPlayers: [],
         blocksAround: []
      };
      this.decisions = [];
      this.rules = this.initializeRules();
   }

   initializeRules() {
      return {
         survival: [
            { condition: () => this.state.health < 6, action: 'retreat', priority: 10 },
            { condition: () => this.state.hunger < 6, action: 'findFood', priority: 9 },
            { condition: () => this.hasHostileMobs(), action: 'defend', priority: 8 },
            { condition: () => this.isInDanger(), action: 'escape', priority: 8 }
         ],
         task: [
            { condition: () => this.isInventoryFull(), action: 'depositItems', priority: 7 },
            { condition: () => this.needsTools(), action: 'craftTools', priority: 6 },
            { condition: () => this.state.currentTask, action: 'executeTask', priority: 5 }
         ],
         idle: [
            { condition: () => this.state.mode === 'basic', action: 'antiAFK', priority: 1 },
            { condition: () => true, action: 'wander', priority: 0 }
         ]
      };
   }

   async makeDecision() {
      this.updateState();
      
      const allRules = [
         ...this.rules.survival,
         ...this.rules.task,
         ...this.rules.idle
      ].sort((a, b) => b.priority - a.priority);

      for (const rule of allRules) {
         if (rule.condition()) {
            this.decisions.push({
               action: rule.action,
               timestamp: Date.now(),
               state: { ...this.state }
            });
            return rule.action;
         }
      }

      return 'idle';
   }

   updateState() {
      if (!this.bot || !this.bot.entity) return;

      this.state.health = this.bot.health;
      this.state.hunger = this.bot.food;
      this.state.position = this.bot.entity.position;
      
      const entities = Object.values(this.bot.entities);
      this.state.nearbyMobs = entities.filter(e => 
         e.type === 'mob' && 
         e.position.distanceTo(this.bot.entity.position) < 16
      );
      
      this.state.nearbyPlayers = entities.filter(e => 
         e.type === 'player' && 
         e.username !== this.bot.username &&
         e.position.distanceTo(this.bot.entity.position) < 32
      );

      this.updateInventory();
   }

   updateInventory() {
      if (!this.bot.inventory) return;
      
      this.state.inventory = {};
      this.bot.inventory.items().forEach(item => {
         this.state.inventory[item.name] = (this.state.inventory[item.name] || 0) + item.count;
      });
   }

   hasHostileMobs() {
      const hostileTypes = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'witch'];
      return this.state.nearbyMobs.some(mob => 
         hostileTypes.some(type => mob.name?.toLowerCase().includes(type))
      );
   }

   isInDanger() {
      if (!this.bot.entity) return false;
      
      const pos = this.bot.entity.position;
      const blockBelow = this.bot.blockAt(pos.offset(0, -1, 0));
      const blockAhead = this.bot.blockAt(pos.offset(0, 0, 1));
      
      if (!blockBelow || blockBelow.name === 'air') return true;
      
      if (blockAhead && (blockAhead.name === 'lava' || blockAhead.name === 'fire')) {
         return true;
      }

      return false;
   }

   isInventoryFull() {
      if (!this.bot.inventory) return false;
      return this.bot.inventory.items().length >= 36;
   }

   needsTools() {
      const hasPickaxe = Object.keys(this.state.inventory).some(item => 
         item.includes('pickaxe')
      );
      const hasSword = Object.keys(this.state.inventory).some(item => 
         item.includes('sword')
      );
      
      return !hasPickaxe || !hasSword;
   }

   setMode(mode) {
      if (['basic', 'advanced'].includes(mode)) {
         this.state.mode = mode;
         return true;
      }
      return false;
   }

   setTask(task) {
      this.state.currentTask = task;
   }

   getState() {
      return { ...this.state };
   }

   getDecisionHistory(limit = 10) {
      return this.decisions.slice(-limit);
   }
}

module.exports = AIBrain;
