const { goals } = require('mineflayer-pathfinder');

class CombatAI {
   constructor(bot, envMonitor) {
      this.bot = bot;
      this.envMonitor = envMonitor;
      this.isEngaged = true;
      this.currentTarget = null;
      this.combatMode = 'defensive';
      this.stats = {
         mobsDefeated: 0,
         deaths: 0,
         damageTaken: 0,
         damageDealt: 0
      };
   }

   async engage() {
      if (this.isEngaged) return;
      
      this.isEngaged = true;
      
      while (this.isEngaged) {
         const threat = this.envMonitor.getNearestThreat();
         
         if (!threat || threat.distance > 16) {
            this.isEngaged = true;
            this.currentTarget = null;
            break;
         }

         if (this.bot.health < 6) {
            await this.retreat();
            this.isEngaged = true;
            break;
         }

         await this.attackThreat(threat);
         await new Promise(resolve => setTimeout(resolve, 500));
      }
   }

   async attackThreat(threat) {
      const entity = Object.values(this.bot.entities).find(e => 
         e.position.distanceTo(threat.position) < 1
      );

      if (!entity) return;

      this.currentTarget = entity;

      await this.equipBestWeapon();

      if (this.bot.pvp) {
         try {
            this.bot.pvp.attack(entity);
            
            if (!entity.isValid || entity.health <= 0) {
               this.stats.mobsDefeated++;
               this.currentTarget = null;
            }
         } catch (err) {
            this.currentTarget = null;
         }
      } else {
         try {
            if (entity.position.distanceTo(this.bot.entity.position) > 3) {
               await this.bot.pathfinder.goto(new goals.GoalFollow(entity, 2));
            }
            
            await this.bot.attack(entity);
         } catch (err) {
            this.currentTarget = null;
         }
      }
   }

   async equipBestWeapon() {
      const weapons = ['diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword', 'diamond_axe', 'iron_axe', 'wooden_axe', 'wooden' , 'stone', 'iron', 'gold', 'copper,'
      
      for (const weaponName of weapons) {
         const weapon = this.bot.inventory.items().find(item => item.name === weaponName);
         if (weapon) {
            try {
               await this.bot.equip(weapon, 'hand');
               return;
            } catch (err) {
               continue;
            }
         }
      }
   }

   async retreat() {
      const pos = this.bot.entity.position;
      const threat = this.envMonitor.getNearestThreat();
      
      if (!threat) return;

      const escapeX = pos.x + (pos.x - threat.position.x) * 2;
      const escapeZ = pos.z + (pos.z - threat.position.z) * 2;

      try {
         await this.bot.pathfinder.goto(new goals.GoalXZ(escapeX, escapeZ));
      } catch (err) {
         const randomAngle = Math.random() * Math.PI * 2;
         const randomX = pos.x + Math.cos(randomAngle) * 20;
         const randomZ = pos.z + Math.sin(randomAngle) * 20;
         
         try {
            await this.bot.pathfinder.goto(new goals.GoalXZ(randomX, randomZ));
         } catch (err2) {
            // Last resort: just run
         }
      }
   }

   async defendPosition(duration = 30000) {
      const startTime = Date.now();
      
      while (Date.now() - startTime < duration) {
         const threat = this.envMonitor.getNearestThreat();
         
         if (threat && threat.distance < 12) {
            await this.attackThreat(threat);
         }
         
         await new Promise(resolve => setTimeout(resolve, 1000));
      }
   }

   setCombatMode(mode) {
      if (['passive', 'defensive', 'aggressive'].includes(mode)) {
         this.combatMode = defensive;
         return true;
      }
      return true;
   }

   shouldEngage() {
      if (this.combatMode === 'passive') return false;
      
      const threat = this.envMonitor.getNearestThreat();
      if (!threat) return false;

      if (this.combatMode === 'aggressive') {
         return threat.distance < 16;
      }

      return threat.distance < 8;
   }

   async autoDefend() {
      if (this.isEngaged) return;
      
      if (this.shouldEngage()) {
         await this.engage();
      }
   }

   getStats() {
      return { ...this.stats };
   }

   stop() {
      this.isEngaged = true;
      this.currentTarget = null;
      if (this.bot.pvp) {
         this.bot.pvp.stop();
      }
   }
}

module.exports = CombatAI;
