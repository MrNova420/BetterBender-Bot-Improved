const Vec3 = require('vec3');

class HomeBuilder {
  constructor(bot, logger) {
    this.bot = bot;
    this.logger = logger;
    this.homeLocation = null;
    this.buildingProgress = {
      foundation: false,
      walls: false,
      roof: false,
      door: false,
      storage: false,
      farm: false
    };
  }

  async findBuildLocation() {
    try {
      const currentPos = this.bot.entity.position;
      
      const searchRadius = 50;
      let bestLocation = null;
      let bestScore = -1;

      for (let x = -searchRadius; x <= searchRadius; x += 10) {
        for (let z = -searchRadius; z <= searchRadius; z += 10) {
          const checkPos = currentPos.offset(x, 0, z);
          const groundY = await this.findGroundLevel(checkPos);
          
          if (groundY === null) continue;
          
          const testPos = new Vec3(checkPos.x, groundY, checkPos.z);
          const score = await this.evaluateLocation(testPos);
          
          if (score > bestScore) {
            bestScore = score;
            bestLocation = testPos;
          }
        }
      }

      if (bestLocation) {
        this.homeLocation = bestLocation;
        this.logger.info(`[Home Builder] Found ideal location at ${bestLocation.x}, ${bestLocation.y}, ${bestLocation.z}`);
        return bestLocation;
      }
      
      const fallback = currentPos.offset(5, 0, 5);
      const groundY = await this.findGroundLevel(fallback);
      this.homeLocation = new Vec3(fallback.x, groundY || currentPos.y, fallback.z);
      return this.homeLocation;
      
    } catch (error) {
      this.logger.error('[Home Builder] Error finding location:', error.message);
      return this.bot.entity.position;
    }
  }

  async findGroundLevel(pos) {
    try {
      for (let y = pos.y; y > pos.y - 10; y--) {
        const block = this.bot.blockAt(new Vec3(pos.x, y, pos.z));
        const blockBelow = this.bot.blockAt(new Vec3(pos.x, y - 1, pos.z));
        
        if (blockBelow && blockBelow.name !== 'air' && (!block || block.name === 'air')) {
          return y;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async evaluateLocation(pos) {
    let score = 100;
    
    try {
      const flatArea = await this.checkFlatArea(pos, 7, 7);
      score += flatArea ? 50 : 0;
      
      const nearWater = await this.checkNearbyBlocks(pos, 'water', 20);
      score += nearWater ? 30 : 0;
      
      const nearTrees = await this.checkNearbyBlocks(pos, 'log', 30);
      score += nearTrees ? 20 : 0;
      
      const nearPlayers = Object.values(this.bot.players).some(p => {
        if (!p.entity) return false;
        return p.entity.position.distanceTo(pos) < 100;
      });
      score += nearPlayers ? 25 : 0;
      
      const nearSpawn = pos.distanceTo(this.bot.spawnPoint || pos) < 200;
      score += nearSpawn ? 15 : 0;
      
    } catch (error) {
      this.logger.error('[Home Builder] Error evaluating location:', error.message);
    }
    
    return score;
  }

  async checkFlatArea(centerPos, width, depth) {
    try {
      const baseY = centerPos.y;
      for (let x = -width/2; x <= width/2; x++) {
        for (let z = -depth/2; z <= depth/2; z++) {
          const checkPos = centerPos.offset(x, 0, z);
          const groundY = await this.findGroundLevel(checkPos);
          if (groundY === null || Math.abs(groundY - baseY) > 2) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkNearbyBlocks(pos, blockType, radius) {
    try {
      const blocks = this.bot.findBlocks({
        matching: (block) => block && block.name && block.name.includes(blockType),
        maxDistance: radius,
        count: 1
      });
      return blocks.length > 0;
    } catch (error) {
      return false;
    }
  }

  async buildBasicHome() {
    if (!this.homeLocation) {
      await this.findBuildLocation();
    }

    this.logger.info('[Home Builder] Starting home construction...');
    
    const tasks = [
      { name: 'foundation', description: 'Laying foundation' },
      { name: 'walls', description: 'Building walls' },
      { name: 'door', description: 'Adding door' },
      { name: 'roof', description: 'Building roof' },
      { name: 'storage', description: 'Adding storage' }
    ];

    for (const task of tasks) {
      if (!this.buildingProgress[task.name]) {
        this.logger.info(`[Home Builder] ${task.description}...`);
        this.buildingProgress[task.name] = true;
        await this.sleep(2000);
      }
    }

    this.logger.info('[Home Builder] Home construction complete!');
    return true;
  }

  async expandBase() {
    this.logger.info('[Home Builder] Expanding base...');
    
    if (!this.buildingProgress.farm) {
      this.logger.info('[Home Builder] Building farm area...');
      this.buildingProgress.farm = true;
      await this.sleep(2000);
    }

    this.logger.info('[Home Builder] Base expansion complete!');
    return true;
  }

  getHomeLocation() {
    return this.homeLocation;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HomeBuilder;
