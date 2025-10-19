class TradingSystem {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    
    this.itemValues = this._initializeItemValues();
    this.activeTrades = new Map();
  }

  _initializeItemValues() {
    return {
      diamond: 100,
      emerald: 80,
      gold_ingot: 60,
      iron_ingot: 30,
      coal: 10,
      stone: 5,
      cobblestone: 5,
      oak_log: 8,
      spruce_log: 8,
      birch_log: 8,
      wheat: 6,
      bread: 12,
      cooked_beef: 15,
      raw_beef: 8,
      apple: 7,
      golden_apple: 50,
      diamond_sword: 250,
      diamond_pickaxe: 300,
      iron_sword: 90,
      iron_pickaxe: 90,
      stone_sword: 20,
      stone_pickaxe: 20,
      wooden_sword: 10,
      wooden_pickaxe: 10,
      torch: 3,
      crafting_table: 10,
      furnace: 15,
      chest: 20,
      door: 8,
      glass: 4,
      sand: 2,
      gravel: 2,
      dirt: 1
    };
  }

  getItemValue(itemName, personality, supplyDemand = 1.0) {
    const baseValue = this.itemValues[itemName] || 10;
    
    let personalityMultiplier = 1.0;
    
    if (personality) {
      if (itemName.includes('diamond') || itemName.includes('emerald')) {
        personalityMultiplier += (personality.ambition || 0.5) * 0.5;
      }
      
      if (itemName.includes('food') || itemName.includes('beef') || itemName.includes('bread')) {
        personalityMultiplier += (personality.empathy || 0.5) * 0.3;
      }
      
      if (itemName.includes('sword') || itemName.includes('armor')) {
        personalityMultiplier += (personality.aggression || 0.5) * 0.4;
      }
      
      if (itemName.includes('_log') || itemName.includes('plank')) {
        personalityMultiplier += (personality.work_ethic || 0.5) * 0.2;
      }
    }
    
    return Math.floor(baseValue * personalityMultiplier * supplyDemand);
  }

  proposeTradeOffer(botId, targetBotId, offerItems, requestItems) {
    try {
      const bot = this.db.getBot(botId);
      const targetBot = this.db.getBot(targetBotId);
      
      if (!bot || !targetBot) {
        return { success: false, reason: 'invalid_bots' };
      }

      const botPersonality = this.db.getPersonality(botId);
      const targetPersonality = this.db.getPersonality(targetBotId);
      
      const relationship = this.db.getRelationship(botId, targetBotId);
      const trustLevel = relationship ? relationship.trust_level : 0.5;
      
      let offerValue = 0;
      for (const item of offerItems) {
        offerValue += this.getItemValue(item.name, targetPersonality) * item.count;
      }
      
      let requestValue = 0;
      for (const item of requestItems) {
        requestValue += this.getItemValue(item.name, botPersonality) * item.count;
      }
      
      const fairnessRatio = offerValue / (requestValue || 1);
      
      const trustBonus = (trustLevel - 0.5) * 0.3;
      const fairnessThreshold = 0.8 + trustBonus;
      
      const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.activeTrades.set(tradeId, {
        id: tradeId,
        from_bot: botId,
        to_bot: targetBotId,
        offer: offerItems,
        request: requestItems,
        offer_value: offerValue,
        request_value: requestValue,
        fairness: fairnessRatio,
        status: 'proposed',
        timestamp: Date.now()
      });
      
      this.logger.info(`[Trade] ${bot.name} → ${targetBot.name}: Offer=${offerValue}, Request=${requestValue}, Fairness=${fairnessRatio.toFixed(2)}`);
      
      return {
        success: true,
        tradeId,
        fairness: fairnessRatio,
        likely_accepted: fairnessRatio >= fairnessThreshold
      };
    } catch (error) {
      this.logger.error('[Trade] Propose failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  evaluateTradeOffer(tradeId, targetBotId) {
    try {
      const trade = this.activeTrades.get(tradeId);
      
      if (!trade) {
        return { accept: false, reason: 'trade_not_found' };
      }

      if (trade.to_bot !== targetBotId) {
        return { accept: false, reason: 'not_for_you' };
      }

      const targetPersonality = this.db.getPersonality(targetBotId);
      const relationship = this.db.getRelationship(trade.from_bot, targetBotId);
      const trustLevel = relationship ? relationship.trust_level : 0.5;
      
      const needsEvaluation = this._evaluateNeeds(targetBotId, trade.request);
      
      let acceptanceThreshold = 0.8;
      
      if (trustLevel > 0.7) {
        acceptanceThreshold -= 0.2;
      }
      
      if (targetPersonality.empathy > 0.7) {
        acceptanceThreshold -= 0.1;
      }
      
      if (targetPersonality.ambition > 0.8) {
        acceptanceThreshold += 0.1;
      }
      
      acceptanceThreshold -= needsEvaluation * 0.2;
      
      const willAccept = trade.fairness >= acceptanceThreshold;
      
      const counterOfferFairness = this._calculateCounterOffer(trade, targetPersonality);
      
      this.logger.info(`[Trade] ${targetBotId} evaluating: Fairness=${trade.fairness.toFixed(2)}, Threshold=${acceptanceThreshold.toFixed(2)}, Accept=${willAccept}`);
      
      return {
        accept: willAccept,
        fairness: trade.fairness,
        threshold: acceptanceThreshold,
        counter_offer: !willAccept && trade.fairness > 0.5 ? counterOfferFairness : null
      };
    } catch (error) {
      this.logger.error('[Trade] Evaluation failed:', error.message);
      return { accept: false, reason: error.message };
    }
  }

  _evaluateNeeds(botId, requestedItems) {
    let needScore = 0;
    
    for (const item of requestedItems) {
      if (item.name.includes('food') || item.name.includes('bread') || item.name.includes('beef')) {
        needScore += 0.3;
      }
      
      if (item.name.includes('pickaxe') || item.name.includes('axe') || item.name.includes('sword')) {
        needScore += 0.2;
      }
      
      if (item.name.includes('diamond') || item.name.includes('iron')) {
        needScore += 0.15;
      }
    }
    
    return Math.min(needScore, 1.0);
  }

  _calculateCounterOffer(trade, personality) {
    const targetFairness = 0.9 + (personality.empathy || 0.5) * 0.1;
    
    const adjustmentFactor = targetFairness / trade.fairness;
    
    return {
      suggested_fairness: targetFairness,
      adjustment_factor: adjustmentFactor
    };
  }

  executeTradeExchange(tradeId, accepted) {
    try {
      const trade = this.activeTrades.get(tradeId);
      
      if (!trade) {
        return { success: false, reason: 'trade_not_found' };
      }

      if (!accepted) {
        trade.status = 'rejected';
        this.logger.info(`[Trade] Trade ${tradeId} rejected`);
        
        this.db.addMemory(trade.from_bot, {
          type: 'trade_rejected',
          other_bot: trade.to_bot,
          details: trade
        });
        
        this.db.addMemory(trade.to_bot, {
          type: 'trade_rejected',
          other_bot: trade.from_bot,
          details: trade
        });
        
        return { success: true, status: 'rejected' };
      }

      trade.status = 'accepted';
      
      this.db.addMemory(trade.from_bot, {
        type: 'trade_completed',
        other_bot: trade.to_bot,
        gave: trade.offer,
        received: trade.request
      });
      
      this.db.addMemory(trade.to_bot, {
        type: 'trade_completed',
        other_bot: trade.from_bot,
        gave: trade.request,
        received: trade.offer
      });
      
      this.db.updateRelationship(trade.from_bot, trade.to_bot, {
        trust_change: 0.05,
        interaction_type: 'trade'
      });
      
      this.logger.info(`[Trade] Trade ${tradeId} completed successfully`);
      
      this.activeTrades.delete(tradeId);
      
      return {
        success: true,
        status: 'completed',
        trade
      };
    } catch (error) {
      this.logger.error('[Trade] Exchange failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  getTradeHistory(botId, limit = 10) {
    try {
      const memories = this.db.getMemoriesByType(botId, 'trade_completed', limit);
      return memories;
    } catch (error) {
      this.logger.error('[Trade] Get history failed:', error.message);
      return [];
    }
  }

  suggestTradeForNeeds(botId, needs = []) {
    try {
      const bot = this.db.getBot(botId);
      const personality = this.db.getPersonality(botId);
      const allBots = this.db.getAllBots().filter(b => b.id !== botId);
      
      const suggestions = [];
      
      for (const need of needs) {
        for (const otherBot of allBots) {
          const relationship = this.db.getRelationship(botId, otherBot.id);
          const trustLevel = relationship ? relationship.trust_level : 0.5;
          
          if (trustLevel < 0.3) continue;
          
          suggestions.push({
            target_bot: otherBot.id,
            target_name: otherBot.name,
            request_item: need,
            trust_level: trustLevel,
            priority: trustLevel * (1 + (personality.sociability || 0.5))
          });
        }
      }
      
      suggestions.sort((a, b) => b.priority - a.priority);
      
      return suggestions.slice(0, 5);
    } catch (error) {
      this.logger.error('[Trade] Suggest trades failed:', error.message);
      return [];
    }
  }

  cleanupExpiredTrades(maxAge = 300000) {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [tradeId, trade] of this.activeTrades.entries()) {
      if (now - trade.timestamp > maxAge) {
        this.activeTrades.delete(tradeId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.info(`[Trade] Cleaned up ${cleaned} expired trades`);
    }
    
    return cleaned;
  }
}

module.exports = TradingSystem;
