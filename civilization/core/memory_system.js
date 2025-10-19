class MemorySystem {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    
    this.memoryTypes = {
      INTERACTION: 'interaction',
      DISCOVERY: 'discovery',
      ACHIEVEMENT: 'achievement',
      LOCATION: 'location',
      TRADE: 'trade',
      EMOTION: 'emotion',
      EVENT: 'event'
    };
    
    this.importanceThresholds = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 0.8
    };
  }
  
  recordInteraction(botId, otherBotId, interactionType, outcome, location = null) {
    const importance = this._calculateImportance(interactionType, outcome);
    
    const content = JSON.stringify({
      type: interactionType,
      outcome: outcome,
      timestamp: Date.now()
    });
    
    this.db.addMemory(
      botId,
      this.memoryTypes.INTERACTION,
      content,
      importance,
      otherBotId,
      location
    );
    
    const affinityChange = outcome === 'positive' ? 0.1 : (outcome === 'negative' ? -0.1 : 0);
    const trustChange = outcome === 'positive' ? 0.05 : (outcome === 'negative' ? -0.15 : 0);
    
    this.db.updateRelationship(botId, otherBotId, affinityChange, trustChange);
    
    this.logger.info(`[Memory] Bot ${botId} recorded ${interactionType} with ${otherBotId}: ${outcome}`);
    
    return importance;
  }
  
  recordDiscovery(botId, discoveryType, details, location) {
    const importance = discoveryType === 'rare_resource' ? 0.8 : 
                      discoveryType === 'structure' ? 0.7 : 0.5;
    
    const content = JSON.stringify({
      type: discoveryType,
      details: details,
      timestamp: Date.now()
    });
    
    this.db.addMemory(
      botId,
      this.memoryTypes.DISCOVERY,
      content,
      importance,
      null,
      location
    );
    
    return importance;
  }
  
  recordAchievement(botId, achievementType, description) {
    const content = JSON.stringify({
      achievement: achievementType,
      description: description,
      timestamp: Date.now()
    });
    
    this.db.addMemory(
      botId,
      this.memoryTypes.ACHIEVEMENT,
      content,
      0.9,
      null,
      null
    );
    
    this.logger.info(`[Memory] Bot ${botId} achieved: ${achievementType}`);
  }
  
  recordLocation(botId, locationType, name, location) {
    const content = JSON.stringify({
      locationType: locationType,
      name: name,
      timestamp: Date.now()
    });
    
    const importance = locationType === 'home' ? 0.9 : 
                      locationType === 'village' ? 0.8 : 0.5;
    
    this.db.addMemory(
      botId,
      this.memoryTypes.LOCATION,
      content,
      importance,
      null,
      location
    );
  }
  
  recordTrade(botId, otherBotId, itemsGiven, itemsReceived, location) {
    const content = JSON.stringify({
      gave: itemsGiven,
      received: itemsReceived,
      timestamp: Date.now()
    });
    
    this.db.addMemory(
      botId,
      this.memoryTypes.TRADE,
      content,
      0.6,
      otherBotId,
      location
    );
    
    this.db.updateRelationship(botId, otherBotId, 0.05, 0.1);
  }
  
  recordEmotionalEvent(botId, emotionType, intensity, trigger) {
    const content = JSON.stringify({
      emotion: emotionType,
      intensity: intensity,
      trigger: trigger,
      timestamp: Date.now()
    });
    
    const importance = intensity > 0.7 ? 0.7 : 0.4;
    
    this.db.addMemory(
      botId,
      this.memoryTypes.EMOTION,
      content,
      importance,
      null,
      null
    );
  }
  
  getRelevantMemories(botId, context, limit = 10) {
    const recentMemories = this.db.getRecentMemories(botId, 100);
    
    const scored = recentMemories.map(memory => {
      let relevanceScore = memory.importance;
      
      const age = Date.now() - memory.timestamp;
      const ageHours = age / (1000 * 60 * 60);
      const recencyBonus = Math.max(0, 1 - (ageHours / 168));
      relevanceScore *= (0.7 + recencyBonus * 0.3);
      
      if (context.nearbyBots && memory.related_bot_id) {
        if (context.nearbyBots.includes(memory.related_bot_id)) {
          relevanceScore *= 1.5;
        }
      }
      
      if (context.currentLocation && memory.location_x !== null) {
        const distance = Math.sqrt(
          Math.pow(context.currentLocation.x - memory.location_x, 2) +
          Math.pow(context.currentLocation.z - memory.location_z, 2)
        );
        
        if (distance < 50) {
          relevanceScore *= 1.3;
        }
      }
      
      return { ...memory, relevanceScore };
    });
    
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return scored.slice(0, limit);
  }
  
  generateMemorySummary(botId) {
    const memories = this.db.getRecentMemories(botId, 200);
    
    const summary = {
      totalMemories: memories.length,
      byType: {},
      importantMemories: [],
      recentInteractions: [],
      discoveries: []
    };
    
    for (const memory of memories) {
      summary.byType[memory.type] = (summary.byType[memory.type] || 0) + 1;
      
      if (memory.importance > this.importanceThresholds.HIGH) {
        summary.importantMemories.push(memory);
      }
      
      if (memory.type === this.memoryTypes.INTERACTION && summary.recentInteractions.length < 10) {
        summary.recentInteractions.push(memory);
      }
      
      if (memory.type === this.memoryTypes.DISCOVERY && summary.discoveries.length < 10) {
        summary.discoveries.push(memory);
      }
    }
    
    return summary;
  }
  
  _calculateImportance(interactionType, outcome) {
    const baseImportance = {
      'greeting': 0.3,
      'trade': 0.6,
      'cooperation': 0.7,
      'conflict': 0.8,
      'alliance': 0.9,
      'gift': 0.6
    };
    
    let importance = baseImportance[interactionType] || 0.5;
    
    if (outcome === 'positive') importance *= 1.1;
    if (outcome === 'negative') importance *= 1.2;
    
    return Math.min(1, importance);
  }
  
  decayMemories(botId, decayRate = 0.05) {
    const memories = this.db.getRecentMemories(botId, 1000);
    
    let decayedCount = 0;
    
    for (const memory of memories) {
      const age = Date.now() - memory.timestamp;
      const ageWeeks = age / (1000 * 60 * 60 * 24 * 7);
      
      if (ageWeeks > 4 && memory.importance < this.importanceThresholds.HIGH) {
        decayedCount++;
      }
    }
    
    return decayedCount;
  }
}

module.exports = MemorySystem;
