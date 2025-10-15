class EnvironmentMonitor {
   constructor(bot) {
      this.bot = bot;
      this.state = {
         threats: [],
         hazards: [],
         resources: [],
         terrain: {},
         weather: 'clear',
         timeOfDay: 'day',
         nearbyStructures: []
      };
      this.scanInterval = null;
      this.scanRadius = 32;
      this.currentMode = 'basic';
   }

   start(mode = 'advaced') {
      this.stop();
      this.currentMode = mode;
      const scanDelay = mode === 'advanced' ? 3000 : 5000;
      this.scanInterval = setInterval(() => {
         this.scanEnvironment();
      }, scanDelay);
   }

   stop() {
      if (this.scanInterval) {
         clearInterval(this.scanInterval);
         this.scanInterval = null;
      }
   }

   scanEnvironment() {
      if (!this.bot.entity) return;

      this.detectThreats();
      this.detectHazards();
      this.scanResources();
      this.analyzeTerrrain();
      this.checkWeather();
   }

   detectThreats() {
      this.state.threats = [];
      const hostileMobs = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman', 'tuff', 'witch', 'vindicator', 'pillager', 'wither_skeleton'];
      
      const entities = Object.values(this.bot.entities);
      
      for (const entity of entities) {
         if (entity.type !== 'mob') continue;
         
         const distance = entity.position.distanceTo(this.bot.entity.position);
         if (distance > this.scanRadius) continue;

         const isHostile = hostileMobs.some(mobType => 
            entity.name?.toLowerCase().includes(mobType)
         );

         if (isHostile) {
            this.state.threats.push({
               type: entity.name,
               position: entity.position,
               distance: distance,
               health: entity.metadata?.[8] || 0,
               danger: this.calculateDanger(entity.name, distance)
            });
         }
      }

      this.state.threats.sort((a, b) => b.danger - a.danger);
   }

   calculateDanger(mobType, distance) {
      const baseDanger = {
         creeper: 10,
         wither_skeleton: 9,
         vindicator: 8,
         enderman: 7,
         witch: 7,
         skeleton: 6,
         zombie: 5,
         spider: 4
      };

      const danger = baseDanger[mobType] || 3;
      const distanceFactor = Math.max(0, 1 - distance / 20);
      
      return danger * (1 + distanceFactor);
   }

   detectHazards() {
      this.state.hazards = [];
      const pos = this.bot.entity.position;
      const dangerousBlocks = ['lava', 'fire', 'magma_block', 'cactus', 'sweet_berry_bush'];

      for (let x = -8; x <= 8; x++) {
         for (let y = -3; y <= 3; y++) {
            for (let z = -8; z <= 8; z++) {
               const block = this.bot.blockAt(pos.offset(x, y, z));
               if (block && dangerousBlocks.includes(block.name)) {
                  this.state.hazards.push({
                     type: block.name,
                     position: block.position,
                     distance: block.position.distanceTo(pos)
                  });
               }
            }
         }
      }

      const blockBelow = this.bot.blockAt(pos.offset(0, -1, 0));
      if (!blockBelow || blockBelow.name === 'air') {
         this.state.hazards.push({
            type: 'void',
            position: pos.offset(0, -1, 0),
            distance: 0
         });
      }
   }

   scanResources() {
      this.state.resources = [];
      const pos = this.bot.entity.position;
      const valuableBlocks = [
         'diamond_ore', 'iron_ore', 'gold_ore', 'coal_ore', 'emerald_ore',
         'oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'acacia_log', 'dark_oak_log',
         'chest', 'barrel', 'furnace'
      ];

      for (let x = -12; x <= 12; x += 2) {
         for (let y = -4; y <= 4; y += 2) {
            for (let z = -12; z <= 12; z += 2) {
               const block = this.bot.blockAt(pos.offset(x, y, z));
               if (block && valuableBlocks.includes(block.name)) {
                  this.state.resources.push({
                     type: block.name,
                     position: block.position,
                     distance: block.position.distanceTo(pos)
                  });
               }
            }
         }
      }

      this.state.resources.sort((a, b) => a.distance - b.distance);
      this.state.resources = this.state.resources.slice(0, 20);
   }

   analyzeTerrrain() {
      const pos = this.bot.entity.position;
      const blocks = {
         solid: 0,
         liquid: 0,
         air: 0,
         vegetation: 0
      };

      for (let x = -4; x <= 4; x++) {
         for (let y = -2; y <= 2; y++) {
            for (let z = -4; z <= 4; z++) {
               const block = this.bot.blockAt(pos.offset(x, y, z));
               if (!block) continue;

               if (block.name === 'air') blocks.air++;
               else if (block.name === 'water' || block.name === 'lava') blocks.liquid++;
               else if (block.name.includes('leaves') || block.name.includes('grass')) blocks.vegetation++;
               else blocks.solid++;
            }
         }
      }

      this.state.terrain = {
         blocks,
         biome: this.bot.blockAt(pos)?.biome?.name || 'unknown',
         elevation: Math.floor(pos.y),
         openness: blocks.air / (blocks.solid + blocks.air + blocks.liquid + blocks.vegetation)
      };
   }

   checkWeather() {
      if (this.bot.isRaining) {
         this.state.weather = this.bot.thunderState > 0 ? 'thundering' : 'raining';
      } else {
         this.state.weather = 'clear';
      }

      const time = this.bot.time.timeOfDay;
      if (time < 6000) this.state.timeOfDay = 'morning';
      else if (time < 12000) this.state.timeOfDay = 'day';
      else if (time < 13800) this.state.timeOfDay = 'evening';
      else this.state.timeOfDay = 'night';
   }

   isAreaSafe() {
      return this.state.threats.length === 0 && 
             this.state.hazards.length === 0;
   }

   getNearestThreat() {
      return this.state.threats[0] || null;
   }

   getNearestHazard() {
      return this.state.hazards.sort((a, b) => a.distance - b.distance)[0] || null;
   }

   findNearestResource(type) {
      return this.state.resources.find(r => r.type === type) || null;
   }

   getState() {
      return { ...this.state };
   }
}

module.exports = EnvironmentMonitor;
