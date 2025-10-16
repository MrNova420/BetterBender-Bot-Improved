class AFKAddon {
  constructor() {
    this.name = 'afk';
    this.bot = null;
    this.engine = null;
    this.logger = null;
    this.enabled = false;
    
    this.movementInterval = null;
    this.statusInterval = null;
    this.config = {};
  }
  
  init(bot, engine) {
    this.bot = bot;
    this.engine = engine;
    this.logger = engine.getLogger();
    this.config = engine.config.afkMode || {};
    
    this._setupEventHandlers();
    
    if (engine.currentMode === 'afk') {
      this.enable();
    }
  }
  
  _setupEventHandlers() {
    this.bot.on('death', () => {
      if (this.enabled && this.config.autoRespawn) {
        this.logger.info('[AFK] Auto-respawning...');
        setTimeout(() => {
          this.bot.respawn();
        }, 2000);
      }
    });
    
    this.bot.on('health', () => {
      if (this.enabled && this.config.autoEat && this.bot.food < 18) {
        this._tryEat();
      }
    });
    
    this.bot.on('physicsTick', () => {
      if (this.enabled && this.config.avoidMobs) {
        this._checkNearbyMobs();
      }
    });
  }
  
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    this.logger.info('[AFK] Mode activated');
    
    const movementInterval = this.config.movementInterval || 15000;
    this.movementInterval = setInterval(() => {
      this._performMovement();
    }, movementInterval);
    
    const statusInterval = this.config.statusUpdateInterval || 60000;
    this.statusInterval = setInterval(() => {
      this._logStatus();
    }, statusInterval);
  }
  
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    this.logger.info('[AFK] Mode deactivated');
    
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
      this.movementInterval = null;
    }
    
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }
  
  _performMovement() {
    if (!this.bot || !this.bot.entity) return;
    
    const pattern = this.config.movementPattern || 'random';
    const range = this.config.movementRange || 5;
    
    try {
      if (pattern === 'random') {
        const dx = (Math.random() - 0.5) * range;
        const dz = (Math.random() - 0.5) * range;
        
        const targetPos = this.bot.entity.position.offset(dx, 0, dz);
        this.bot.lookAt(targetPos);
        
        const forwardTime = 500 + Math.random() * 1000;
        this.bot.setControlState('forward', true);
        
        setTimeout(() => {
          this.bot.setControlState('forward', false);
          
          if (Math.random() < 0.3) {
            this.bot.setControlState('jump', true);
            setTimeout(() => {
              this.bot.setControlState('jump', false);
            }, 200);
          }
        }, forwardTime);
      }
    } catch (err) {
      this.logger.error('[AFK] Movement error:', err.message);
    }
  }
  
  _checkNearbyMobs() {
    if (!this.bot || !this.bot.entity) return;
    
    try {
      const entities = Object.values(this.bot.entities);
      const hostileMobs = entities.filter(e => {
        if (!e || !e.position || !e.type || e.type !== 'mob') return false;
        if (!e.mobType) return false;
        
        const hostileTypes = ['zombie', 'skeleton', 'spider', 'creeper', 'enderman'];
        return hostileTypes.includes(e.mobType.toLowerCase());
      });
      
      for (const mob of hostileMobs) {
        const distance = this.bot.entity.position.distanceTo(mob.position);
        
        if (distance < 8) {
          this._moveAway(mob.position);
          break;
        }
      }
    } catch (err) {
      this.logger.debug('[AFK] Mob check error:', err.message);
    }
  }
  
  _moveAway(dangerPos) {
    try {
      const currentPos = this.bot.entity.position;
      const dx = currentPos.x - dangerPos.x;
      const dz = currentPos.z - dangerPos.z;
      
      const escapePos = currentPos.offset(dx * 2, 0, dz * 2);
      this.bot.lookAt(escapePos);
      
      this.bot.setControlState('forward', true);
      this.bot.setControlState('sprint', true);
      
      setTimeout(() => {
        this.bot.clearControlStates();
      }, 2000);
      
      this.logger.debug('[AFK] Moving away from danger');
    } catch (err) {
      this.logger.error('[AFK] Escape movement error:', err.message);
    }
  }
  
  _tryEat() {
    try {
      const foods = this.bot.inventory.items().filter(item => {
        return item && item.name && (
          item.name.includes('bread') ||
          item.name.includes('beef') ||
          item.name.includes('pork') ||
          item.name.includes('chicken') ||
          item.name.includes('fish') ||
          item.name.includes('apple') ||
          item.name.includes('carrot') ||
          item.name.includes('potato')
        );
      });
      
      if (foods.length > 0) {
        this.bot.equip(foods[0], 'hand', (err) => {
          if (!err) {
            this.bot.consume((err) => {
              if (!err) {
                this.logger.info('[AFK] Ate food');
              }
            });
          }
        });
      }
    } catch (err) {
      this.logger.debug('[AFK] Eat error:', err.message);
    }
  }
  
  _logStatus() {
    if (!this.bot || !this.bot.entity) return;
    
    const pos = this.bot.entity.position;
    this.logger.info(`[AFK] Status: Health=${this.bot.health} Food=${this.bot.food} Pos=(${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)})`);
  }
  
  cleanup() {
    this.disable();
  }
}

module.exports = new AFKAddon();
