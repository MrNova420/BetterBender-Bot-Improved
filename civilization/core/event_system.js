class EventSystem {
  constructor(db, logger, wsBroker) {
    this.db = db;
    this.logger = logger;
    this.wsBroker = wsBroker;
  }

  recordEvent(eventType, data) {
    try {
      const eventData = {
        type: eventType,
        timestamp: Date.now(),
        ...data
      };
      
      this.db.recordCivilizationEvent(eventData);
      
      if (this.wsBroker) {
        this.wsBroker.broadcast({
          type: 'civilization_event',
          event: eventData
        });
      }
      
      this.logger.info(`[Event] ${eventType}: ${JSON.stringify(data)}`);
      
      return eventData;
    } catch (error) {
      this.logger.error('[Event] Recording failed:', error.message);
      return null;
    }
  }

  handleBotSpawn(botId, botName) {
    const bot = this.db.getBot(botId);
    
    this.recordEvent('bot_awakening', {
      bot_id: botId,
      bot_name: botName,
      position: bot ? { x: bot.position_x, y: bot.position_y, z: bot.position_z } : null
    });
    
    const existingBots = this.db.getAllBots().filter(b => b.id !== botId);
    
    for (const other of existingBots) {
      this.db.addMemory(other.id, {
        type: 'bot_arrival',
        new_bot: botName,
        timestamp: Date.now()
      });
    }
    
    this.db.addMemory(botId, {
      type: 'awakening',
      message: 'First consciousness in the digital world',
      timestamp: Date.now()
    });
  }

  handleBotDisconnect(botId, botName, reason = 'unknown') {
    const bot = this.db.getBot(botId);
    
    this.recordEvent('bot_departure', {
      bot_id: botId,
      bot_name: botName,
      reason: reason,
      final_position: bot ? { x: bot.position_x, y: bot.position_y, z: bot.position_z } : null
    });
    
    const relationships = this.db.getRelationships(botId);
    
    for (const rel of relationships) {
      const otherId = rel.bot_id_1 === botId ? rel.bot_id_2 : rel.bot_id_1;
      
      if (rel.trust_level > 0.7) {
        this.db.addMemory(otherId, {
          type: 'friend_departed',
          friend_name: botName,
          emotional_impact: 0.3,
          timestamp: Date.now()
        });
      }
    }
  }

  handleFirstMeeting(botId1, botId2) {
    const bot1 = this.db.getBot(botId1);
    const bot2 = this.db.getBot(botId2);
    
    if (!bot1 || !bot2) return;
    
    this.recordEvent('first_meeting', {
      bot1_id: botId1,
      bot1_name: bot1.name,
      bot2_id: botId2,
      bot2_name: bot2.name
    });
    
    this.db.addMemory(botId1, {
      type: 'first_meeting',
      other_bot: bot2.name,
      timestamp: Date.now()
    });
    
    this.db.addMemory(botId2, {
      type: 'first_meeting',
      other_bot: bot1.name,
      timestamp: Date.now()
    });
    
    this.db.createRelationship(botId1, botId2, {
      trust_level: 0.5,
      friendship: 0.3,
      interactions: 1
    });
  }

  handleFriendshipFormed(botId1, botId2) {
    const bot1 = this.db.getBot(botId1);
    const bot2 = this.db.getBot(botId2);
    const relationship = this.db.getRelationship(botId1, botId2);
    
    if (!bot1 || !bot2 || !relationship) return;
    
    this.recordEvent('friendship_formed', {
      bot1_id: botId1,
      bot1_name: bot1.name,
      bot2_id: botId2,
      bot2_name: bot2.name,
      trust_level: relationship.trust_level
    });
    
    this.db.addMemory(botId1, {
      type: 'friendship_formed',
      friend_name: bot2.name,
      emotional_impact: 0.5,
      timestamp: Date.now()
    });
    
    this.db.addMemory(botId2, {
      type: 'friendship_formed',
      friend_name: bot1.name,
      emotional_impact: 0.5,
      timestamp: Date.now()
    });
  }

  handleVillageFoundation(villageId, founderIds) {
    const village = this.db.getVillage(villageId);
    
    if (!village) return;
    
    this.recordEvent('village_founded', {
      village_id: villageId,
      village_name: village.name,
      founder_count: founderIds.length,
      location: { x: village.center_x, z: village.center_z }
    });
    
    for (const botId of founderIds) {
      this.db.addMemory(botId, {
        type: 'village_founded',
        village_name: village.name,
        role: 'founder',
        emotional_impact: 0.7,
        timestamp: Date.now()
      });
    }
  }

  handleResourceDiscovery(botId, resourceType, location) {
    const bot = this.db.getBot(botId);
    
    if (!bot) return;
    
    const isRare = ['diamond_ore', 'emerald_ore', 'ancient_debris'].includes(resourceType);
    
    if (isRare) {
      this.recordEvent('rare_discovery', {
        bot_id: botId,
        bot_name: bot.name,
        resource: resourceType,
        location: location
      });
    }
    
    this.db.addMemory(botId, {
      type: 'discovery',
      resource: resourceType,
      location: location,
      emotional_impact: isRare ? 0.6 : 0.2,
      timestamp: Date.now()
    });
    
    const botVillage = this._getBotVillage(botId);
    if (botVillage && isRare) {
      const members = this.db.getVillageMembers(botVillage.id);
      for (const member of members) {
        if (member.id !== botId) {
          this.db.addMemory(member.id, {
            type: 'village_discovery',
            discoverer: bot.name,
            resource: resourceType,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  handleAchievement(botId, achievementType, details = {}) {
    const bot = this.db.getBot(botId);
    
    if (!bot) return;
    
    const achievementMilestones = {
      'first_home': { title: 'Homeowner', impact: 0.8 },
      'first_diamond': { title: 'Gem Hunter', impact: 0.9 },
      'village_leader': { title: 'Leader', impact: 0.9 },
      '100_blocks_mined': { title: 'Miner', impact: 0.4 },
      'first_trade': { title: 'Merchant', impact: 0.5 },
      'survived_night': { title: 'Survivor', impact: 0.3 }
    };
    
    const achievement = achievementMilestones[achievementType] || { title: achievementType, impact: 0.5 };
    
    this.recordEvent('achievement_unlocked', {
      bot_id: botId,
      bot_name: bot.name,
      achievement: achievement.title,
      details: details
    });
    
    this.db.addMemory(botId, {
      type: 'achievement',
      achievement: achievement.title,
      details: details,
      emotional_impact: achievement.impact,
      timestamp: Date.now()
    });
  }

  handleConflict(botId1, botId2, conflictType, outcome) {
    const bot1 = this.db.getBot(botId1);
    const bot2 = this.db.getBot(botId2);
    
    if (!bot1 || !bot2) return;
    
    this.recordEvent('conflict', {
      bot1_id: botId1,
      bot1_name: bot1.name,
      bot2_id: botId2,
      bot2_name: bot2.name,
      type: conflictType,
      outcome: outcome
    });
    
    const trustImpact = conflictType === 'combat' ? -0.3 : -0.1;
    
    this.db.updateRelationship(botId1, botId2, {
      trust_change: trustImpact,
      interaction_type: 'conflict'
    });
    
    this.db.addMemory(botId1, {
      type: 'conflict',
      other_bot: bot2.name,
      conflict_type: conflictType,
      outcome: outcome,
      emotional_impact: -0.4,
      timestamp: Date.now()
    });
    
    this.db.addMemory(botId2, {
      type: 'conflict',
      other_bot: bot1.name,
      conflict_type: conflictType,
      outcome: outcome === 'win' ? 'loss' : outcome === 'loss' ? 'win' : outcome,
      emotional_impact: -0.4,
      timestamp: Date.now()
    });
  }

  handleTradeCompleted(tradeData) {
    const bot1 = this.db.getBot(tradeData.from_bot);
    const bot2 = this.db.getBot(tradeData.to_bot);
    
    if (!bot1 || !bot2) return;
    
    this.recordEvent('trade_completed', {
      trader1_id: bot1.id,
      trader1_name: bot1.name,
      trader2_id: bot2.id,
      trader2_name: bot2.name,
      fairness: tradeData.fairness || 1.0
    });
  }

  handleVillageGoalCompleted(villageId, goalId, goalDescription) {
    const village = this.db.getVillage(villageId);
    
    if (!village) return;
    
    this.recordEvent('village_goal_completed', {
      village_id: villageId,
      village_name: village.name,
      goal: goalDescription
    });
    
    const members = this.db.getVillageMembers(villageId);
    for (const member of members) {
      this.db.addMemory(member.id, {
        type: 'village_achievement',
        village_name: village.name,
        goal: goalDescription,
        emotional_impact: 0.6,
        timestamp: Date.now()
      });
    }
  }

  _getBotVillage(botId) {
    const villages = this.db.getAllVillages();
    
    for (const village of villages) {
      const members = this.db.getVillageMembers(village.id);
      if (members.some(m => m.id === botId)) {
        return village;
      }
    }
    
    return null;
  }

  getRecentEvents(limit = 50) {
    try {
      return this.db.getRecentCivilizationEvents(limit);
    } catch (error) {
      this.logger.error('[Event] Get recent failed:', error.message);
      return [];
    }
  }

  getEventsByType(eventType, limit = 20) {
    try {
      return this.db.getCivilizationEventsByType(eventType, limit);
    } catch (error) {
      this.logger.error('[Event] Get by type failed:', error.message);
      return [];
    }
  }

  generateTimelineForBot(botId) {
    try {
      const memories = this.db.getAllMemories(botId);
      const events = this.getRecentEvents(100);
      
      const botEvents = events.filter(e => 
        e.data.includes(botId) || e.data.includes(this.db.getBot(botId)?.name)
      );
      
      const timeline = [
        ...memories.map(m => ({ ...m, source: 'memory' })),
        ...botEvents.map(e => ({ ...e, source: 'event' }))
      ].sort((a, b) => a.timestamp - b.timestamp);
      
      return timeline;
    } catch (error) {
      this.logger.error('[Event] Timeline generation failed:', error.message);
      return [];
    }
  }
}

module.exports = EventSystem;
