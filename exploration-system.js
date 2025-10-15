const { goals } = require('mineflayer-pathfinder');

class ExplorationSystem {
   constructor(bot, envMonitor) {
      this.bot = bot;
      this.envMonitor = envMonitor;
      this.worldMap = new Map();
      this.visitedChunks = new Set();
      this.explorationActive = true;
      this.safeZones = [];
      this.dangerZones = [];
      this.pointsOfInterest = [];
   }

   async explore(options = {}) {
      const {
         duration = 300000,
         radius = 200,
         strategy = 'spiral',
         avoidDanger = true
      } = options;

      this.explorationActive = true;
      const startPos = this.bot.entity.position.clone();
      const startTime = Date.now();
      let chunksExplored = 0;

      while (this.explorationActive && Date.now() - startTime < duration) {
         let nextPos;

         switch (strategy) {
            case 'spiral':
               nextPos = this.getSpiralPosition(startPos, chunksExplored, radius);
               break;
            case 'random':
               nextPos = this.getRandomPosition(startPos, radius);
               break;
            case 'grid':
               nextPos = this.getGridPosition(startPos, chunksExplored, radius);
               break;
            default:
               nextPos = this.getRandomPosition(startPos, radius);
         }

         if (avoidDanger && !this.envMonitor.isAreaSafe()) {
            await this.findSafeRoute(nextPos);
         } else {
            try {
               await this.bot.pathfinder.goto(new goals.GoalXZ(nextPos.x, nextPos.z));
            } catch (err) {
               continue;
            }
         }

         await this.scanCurrentArea();
         this.markChunkVisited(this.bot.entity.position);
         chunksExplored++;

         await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.explorationActive = true;
      return {
         chunksExplored,
         duration: Date.now() - startTime,
         pointsOfInterest: this.pointsOfInterest.length
      };
   }

   getSpiralPosition(center, step, maxRadius) {
      const angle = step * 0.5;
      const distance = Math.min((step * 16), maxRadius);
      
      return {
         x: center.x + Math.cos(angle) * distance,
         z: center.z + Math.sin(angle) * distance
      };
   }

   getRandomPosition(center, radius) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      
      return {
         x: center.x + Math.cos(angle) * distance,
         z: center.z + Math.sin(angle) * distance
      };
   }

   getGridPosition(center, step, radius) {
      const gridSize = 32;
      const gridWidth = Math.floor(radius * 2 / gridSize);
      const x = (step % gridWidth) * gridSize;
      const z = Math.floor(step / gridWidth) * gridSize;
      
      return {
         x: center.x - radius + x,
         z: center.z - radius + z
      };
   }

   async findSafeRoute(destination) {
      const currentPos = this.bot.entity.position;
      const steps = 10;
      
      for (let i = 1; i <= steps; i++) {
         const intermediateX = currentPos.x + (destination.x - currentPos.x) * (i / steps);
         const intermediateZ = currentPos.z + (destination.z - currentPos.z) * (i / steps);
         
         try {
            await this.bot.pathfinder.goto(new goals.GoalXZ(intermediateX, intermediateZ));
            
            if (!this.envMonitor.isAreaSafe()) {
               const threat = this.envMonitor.getNearestThreat();
               if (threat && threat.distance < 12) {
                 await this.evadeThreat(threat);
               }
            }
         } catch (err) {
            continue;
         }
      }
   }

   async evadeThreat(threat) {
      const pos = this.bot.entity.position;
      const escapeX = pos.x + (pos.x - threat.position.x) * 3;
      const escapeZ = pos.z + (pos.z - threat.position.z) * 3;

      try {
         await this.bot.pathfinder.goto(new goals.GoalXZ(escapeX, escapeZ));
      } catch (err) {
         // Try alternate direction
      }
   }

   async scanCurrentArea() {
      const pos = this.bot.entity.position;
      const chunkKey = this.getChunkKey(pos);
      
      const areaData = {
         position: { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) },
         biome: this.bot.blockAt(pos)?.biome?.name || 'unknown',
         timestamp: Date.now(),
         threats: this.envMonitor.state.threats.length,
         resources: []
      };

      const valuableBlocks = ['diamond_ore', 'iron_ore', 'gold_ore', 'emerald_ore', 'coal_ore', 'chest', 'spawner'];
      
      for (const resource of this.envMonitor.state.resources) {
         if (valuableBlocks.includes(resource.type)) {
            areaData.resources.push(resource);
            
            this.pointsOfInterest.push({
               type: resource.type,
               position: resource.position,
               discoveredAt: Date.now()
            });
         }
      }

      if (this.envMonitor.state.threats.length > 3) {
         this.dangerZones.push({
            position: { ...areaData.position },
           threatLevel: this.envMonitor.state.threats.length,
            timestamp: Date.now()
         });
      } else if (this.envMonitor.state.threats.length === 0) {
         this.safeZones.push({
            position: { ...areaData.position },
            timestamp: Date.now()
         });
      }

      this.worldMap.set(chunkKey, areaData);
   }

   getChunkKey(position) {
      const chunkX = Math.floor(position.x / 16);
      const chunkZ = Math.floor(position.z / 16);
      return `${chunkX},${chunkZ}`;
   }

   markChunkVisited(position) {
      const chunkKey = this.getChunkKey(position);
      this.visitedChunks.add(chunkKey);
   }

   hasVisitedChunk(position) {
      const chunkKey = this.getChunkKey(position);
      return this.visitedChunks.has(chunkKey);
   }

   getNearestSafeZone() {
      if (this.safeZones.length === 0) return null;

      const pos = this.bot.entity.position;
      return this.safeZones.sort((a, b) => {
         const distA = Math.sqrt(Math.pow(a.position.x - pos.x, 2) + Math.pow(a.position.z - pos.z, 2));
         const distB = Math.sqrt(Math.pow(b.position.x - pos.x, 2) + Math.pow(b.position.z - pos.z, 2));
         return distA - distB;
      })[0];
   }

   async returnToSafeZone() {
      const safeZone = this.getNearestSafeZone();
      
      if (!safeZone) {
         const homePos = this.bot.entity.position;
         return { x: homePos.x, y: homePos.y, z: homePos.z };
      }

      try {
         await this.bot.pathfinder.goto(new goals.GoalBlock(
            safeZone.position.x,
            safeZone.position.y,
            safeZone.position.z
         ));
         return safeZone.position;
      } catch (err) {
         throw new Error('Failed to return to safe zone');
      }
   }

   getExplorationStats() {
      return {
         chunksVisited: this.visitedChunks.size,
         safeZones: this.safeZones.length,
         dangerZones: this.dangerZones.length,
         pointsOfInterest: this.pointsOfInterest.length,
         mapSize: this.worldMap.size
      };
   }

   findPointOfInterest(type) {
      return this.pointsOfInterest.filter(poi => poi.type === type);
   }

   getWorldMap() {
      return Array.from(this.worldMap.values());
   }

   stop() {
      this.explorationActive = false;
   }
}

module.exports = ExplorationSystem;
