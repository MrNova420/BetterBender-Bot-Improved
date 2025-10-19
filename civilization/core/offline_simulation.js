class OfflineSimulation {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    
    this.simulationRate = 3600000;
  }
  
  simulateOfflineTime(startTime, endTime) {
    const timeElapsed = endTime - startTime;
    const hoursElapsed = timeElapsed / 3600000;
    
    this.logger.info(`[Offline Sim] Simulating ${hoursElapsed.toFixed(2)} hours of offline time`);
    
    const allBots = this.db.getAllBots();
    
    for (const bot of allBots) {
      this._simulateBotOfflineActivity(bot, hoursElapsed);
    }
    
    this._simulateVillageGrowth(hoursElapsed);
    
    this._generateRandomEvents(hoursElapsed);
    
    this.logger.info(`[Offline Sim] Simulation complete`);
    
    return {
      hoursSimulated: hoursElapsed,
      botsSimulated: allBots.length,
      eventsGenerated: Math.floor(hoursElapsed / 4)
    };
  }
  
  _simulateBotOfflineActivity(bot, hours) {
    const personality = this.db.getPersonality(bot.id);
    if (!personality) return;
    
    const emotions = this.db.getLatestEmotions(bot.id);
    if (!emotions) return;
    
    emotions.hunger = Math.min(1, emotions.hunger + (hours * 0.05));
    emotions.boredom = Math.min(1, emotions.boredom + (hours * 0.1));
    emotions.loneliness = Math.min(1, emotions.loneliness + (hours * 0.08));
    emotions.curiosity = Math.max(0.3, emotions.curiosity - (hours * 0.02));
    emotions.stress = Math.max(0, emotions.stress - (hours * 0.05));
    
    this.db.addEmotion(bot.id, emotions);
    
    const actionsPerformed = Math.floor(hours * (0.5 + personality.work_ethic * 0.5));
    
    for (let i = 0; i < actionsPerformed; i++) {
      const actionType = this._chooseOfflineAction(personality);
      
      this.db.addMemory(
        bot.id,
        'event',
        JSON.stringify({
          action: actionType,
          simulated: true,
          timestamp: Date.now() - (hours * 3600000) + (i * (hours / actionsPerformed) * 3600000)
        }),
        0.3,
        null,
        null
      );
    }
    
    if (bot.position_x !== null && personality.curiosity > 0.6) {
      const wanderDistance = hours * 10 * personality.curiosity;
      const angle = Math.random() * Math.PI * 2;
      
      const newX = bot.position_x + Math.cos(angle) * wanderDistance;
      const newZ = bot.position_z + Math.sin(angle) * wanderDistance;
      
      this.db.updateBotPosition(bot.id, newX, bot.position_y, newZ);
    }
    
    const healthDecay = Math.min(5, hours * 0.5);
    const newHealth = Math.max(10, bot.health - healthDecay);
    
    this.db.updateBotStats(bot.id, newHealth, Math.max(5, bot.food - hours), bot.level, bot.experience);
  }
  
  _chooseOfflineAction(personality) {
    const rand = Math.random();
    
    if (rand < personality.work_ethic * 0.4) {
      return 'gathering';
    } else if (rand < personality.work_ethic * 0.4 + personality.creativity * 0.3) {
      return 'building';
    } else if (rand < personality.work_ethic * 0.4 + personality.creativity * 0.3 + personality.curiosity * 0.3) {
      return 'exploring';
    } else {
      return 'resting';
    }
  }
  
  _simulateVillageGrowth(hours) {
    const villages = this.db.getAllVillages();
    
    for (const village of villages) {
      const members = this.db.getVillageMembers(village.id);
      
      if (members.length === 0) continue;
      
      const growthChance = 0.1 * (hours / 24);
      
      if (Math.random() < growthChance) {
        for (const member of members) {
          const contributionIncrease = Math.random() * hours * 0.5;
          
        }
        
        this.db.logEvent(
          'village_growth',
          `Village ${village.name} has grown and prospered`,
          null,
          village.id,
          { hours: hours }
        );
      }
    }
  }
  
  _generateRandomEvents(hours) {
    const eventChance = hours / 24;
    const numEvents = Math.floor(eventChance * 2);
    
    const eventTypes = [
      { type: 'discovery', description: 'A bot discovered a rare resource deposit' },
      { type: 'weather', description: 'The weather changed dramatically' },
      { type: 'migration', description: 'A bot migrated to a new area' },
      { type: 'construction', description: 'Progress was made on a construction project' },
      { type: 'social', description: 'Bots strengthened their relationships' }
    ];
    
    for (let i = 0; i < numEvents; i++) {
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      this.db.logEvent(
        event.type,
        `[Offline Event] ${event.description}`,
        null,
        null,
        { simulated: true, hoursAgo: hours - (i * hours / numEvents) }
      );
    }
  }
  
  getLastOnlineTime() {
    const events = this.db.getRecentEvents(1);
    
    if (events.length > 0) {
      return events[0].timestamp;
    }
    
    return null;
  }
  
  shouldSimulate(lastOnlineTime) {
    if (!lastOnlineTime) return false;
    
    const now = Date.now();
    const timeSinceOnline = now - lastOnlineTime;
    
    return timeSinceOnline > 3600000;
  }
}

module.exports = OfflineSimulation;
