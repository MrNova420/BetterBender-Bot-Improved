class SocialSystem {
  constructor(db, logger, memorySystem) {
    this.db = db;
    this.logger = logger;
    this.memorySystem = memorySystem;
    
    this.interactionTemplates = {
      greeting: {
        messages: [
          "Hey {name}!",
          "Hi {name}, how's it going?",
          "Hello {name}!",
          "Yo {name}",
          "Greetings {name}"
        ],
        affinityChange: 0.05,
        trustChange: 0.02
      },
      trade_offer: {
        messages: [
          "{name}, want to trade?",
          "Hey {name}, I have some {item} if you need",
          "{name}, looking to trade anything?",
          "Got extra {item}, {name}. Interested?"
        ],
        affinityChange: 0.1,
        trustChange: 0.05
      },
      help_offer: {
        messages: [
          "{name}, need any help?",
          "I can help with {task} if you want, {name}",
          "{name}, let me know if you need anything",
          "Working on {task}, {name}. Want to join?"
        ],
        affinityChange: 0.15,
        trustChange: 0.1
      },
      share_discovery: {
        messages: [
          "{name}, found {discovery} nearby!",
          "Hey {name}, there's {discovery} over at {location}",
          "{name}, check this out: {discovery}",
          "Just discovered {discovery}, {name}"
        ],
        affinityChange: 0.12,
        trustChange: 0.08
      },
      alliance_proposal: {
        messages: [
          "{name}, want to team up?",
          "We should work together, {name}",
          "{name}, let's build something together",
          "How about we form an alliance, {name}?"
        ],
        affinityChange: 0.2,
        trustChange: 0.15
      }
    };
    
    this.allianceThreshold = 0.6;
    this.villageFormationThreshold = 0.7;
  }
  
  initiateInteraction(botId, targetBotId, interactionType, context = {}) {
    const relationship = this.db.getRelationship(botId, targetBotId);
    const targetBot = this.db.getBot(targetBotId);
    
    if (!targetBot) {
      this.logger.warn(`[Social] Target bot ${targetBotId} not found`);
      return null;
    }
    
    const template = this.interactionTemplates[interactionType];
    if (!template) {
      this.logger.warn(`[Social] Unknown interaction type: ${interactionType}`);
      return null;
    }
    
    const message = this._generateMessage(template.messages, {
      name: targetBot.name,
      ...context
    });
    
    const outcome = this._determineOutcome(relationship, interactionType, context);
    
    this.db.updateRelationship(
      botId,
      targetBotId,
      outcome === 'positive' ? template.affinityChange : -template.affinityChange * 0.5,
      outcome === 'positive' ? template.trustChange : -template.trustChange * 0.3
    );
    
    this.memorySystem.recordInteraction(
      botId,
      targetBotId,
      interactionType,
      outcome,
      context.location
    );
    
    this.db.logEvent(
      'social_interaction',
      `${botId} ${interactionType} with ${targetBotId}: ${outcome}`,
      botId,
      null,
      { targetBotId, interactionType, outcome }
    );
    
    this.logger.info(`[Social] ${botId} -> ${targetBotId}: ${interactionType} (${outcome})`);
    
    return {
      message,
      outcome,
      relationship: this.db.getRelationship(botId, targetBotId)
    };
  }
  
  checkAllianceEligibility(botId, targetBotId) {
    const relationship = this.db.getRelationship(botId, targetBotId);
    
    if (!relationship) return false;
    
    return relationship.affinity >= this.allianceThreshold &&
           relationship.trust >= this.allianceThreshold &&
           relationship.interaction_count >= 5;
  }
  
  formAlliance(botId, targetBotId) {
    const eligible = this.checkAllianceEligibility(botId, targetBotId);
    
    if (!eligible) {
      this.logger.warn(`[Social] Alliance not eligible: ${botId} <-> ${targetBotId}`);
      return false;
    }
    
    this.db.updateRelationship(botId, targetBotId, 0.2, 0.2);
    
    this.memorySystem.recordInteraction(
      botId,
      targetBotId,
      'alliance',
      'positive'
    );
    
    this.db.logEvent(
      'alliance_formed',
      `Alliance formed between ${botId} and ${targetBotId}`,
      botId,
      null,
      { targetBotId }
    );
    
    this.logger.info(`[Social] Alliance formed: ${botId} <-> ${targetBotId}`);
    
    return true;
  }
  
  findPotentialVillageMembers(centerLocation, radius = 100) {
    const allBots = this.db.getAllBots();
    
    const nearbyBots = allBots.filter(bot => {
      if (!bot.position_x) return false;
      
      const distance = Math.sqrt(
        Math.pow(bot.position_x - centerLocation.x, 2) +
        Math.pow(bot.position_z - centerLocation.z, 2)
      );
      
      return distance <= radius;
    });
    
    return nearbyBots;
  }
  
  proposeVillageFormation(initiatorBotId, location, potentialMembers) {
    if (potentialMembers.length < 2) {
      this.logger.info(`[Social] Not enough members for village formation`);
      return null;
    }
    
    const strongRelationships = potentialMembers.filter(bot => {
      const rel = this.db.getRelationship(initiatorBotId, bot.id);
      return rel && rel.affinity >= this.villageFormationThreshold;
    });
    
    if (strongRelationships.length < 1) {
      this.logger.info(`[Social] Not enough strong relationships for village`);
      return null;
    }
    
    const villageId = `village_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const villageName = this._generateVillageName();
    
    this.db.createVillage({
      id: villageId,
      name: villageName,
      x: location.x,
      y: location.y,
      z: location.z,
      radius: 50,
      culture: 'emerging'
    });
    
    this.db.addVillageMember(villageId, initiatorBotId, 'founder');
    
    for (const member of strongRelationships) {
      this.db.addVillageMember(villageId, member.id, 'citizen');
    }
    
    this.db.logEvent(
      'village_founded',
      `Village "${villageName}" founded by ${initiatorBotId}`,
      initiatorBotId,
      villageId,
      { memberCount: strongRelationships.length + 1 }
    );
    
    this.logger.info(`[Social] Village "${villageName}" founded with ${strongRelationships.length + 1} members`);
    
    return {
      villageId,
      villageName,
      members: [initiatorBotId, ...strongRelationships.map(b => b.id)]
    };
  }
  
  _generateMessage(templates, context) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    let message = template;
    for (const [key, value] of Object.entries(context)) {
      message = message.replace(`{${key}}`, value || '');
    }
    
    return message;
  }
  
  _determineOutcome(relationship, interactionType, context) {
    let baseChance = 0.7;
    
    if (relationship) {
      baseChance += relationship.affinity * 0.2;
      baseChance += relationship.trust * 0.1;
    }
    
    if (context.hasGift) baseChance += 0.15;
    if (context.isRisky) baseChance -= 0.2;
    
    return Math.random() < baseChance ? 'positive' : 'neutral';
  }
  
  _generateVillageName() {
    const prefixes = ['New', 'Old', 'East', 'West', 'North', 'South', 'Green', 'Stone', 'Oak', 'River'];
    const suffixes = ['haven', 'dale', 'ville', 'town', 'burg', 'field', 'wood', 'hill', 'ridge', 'port'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${suffix}`;
  }
  
  getSocialStatus(botId) {
    const relationships = this.db.getAllRelationships(botId);
    const villages = this.db.getAllVillages();
    
    let villageMembership = null;
    for (const village of villages) {
      const members = this.db.getVillageMembers(village.id);
      if (members.some(m => m.bot_id === botId)) {
        villageMembership = {
          ...village,
          role: members.find(m => m.bot_id === botId).role
        };
        break;
      }
    }
    
    const allies = relationships.filter(r => r.affinity >= this.allianceThreshold);
    const friends = relationships.filter(r => r.affinity >= 0.4);
    
    return {
      relationships: relationships.length,
      allies: allies.length,
      friends: friends.length,
      village: villageMembership,
      topRelationships: relationships.slice(0, 5)
    };
  }
}

module.exports = SocialSystem;
