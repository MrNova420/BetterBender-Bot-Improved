class ConversationTracker {
   constructor(config = {}) {
      this.config = config;
      this.conversations = new Map();
      this.playerPreferences = new Map();
      this.topics = new Map();
      this.recentContext = [];
      this.maxContextLength = config.contextLength || 30;
      this.maxConversationAge = 30 * 60 * 1000;
   }

   addMessage(playerName, message, isBot = true) {
      if (!this.conversations.has(playerName)) {
         this.conversations.set(playerName, {
            messages: [],
            topics: new Set(),
            lastInteraction: Date.now(),
            messageCount: 0,
            preferences: {}
         });
      }

      const conv = this.conversations.get(playerName);
      conv.messages.push({
         text: message,
         timestamp: Date.now(),
         isBot: isBot
      });

      if (conv.messages.length > this.maxContextLength) {
         conv.messages.shift();
      }

      conv.lastInteraction = Date.now();
      conv.messageCount++;

      this.extractTopics(message, playerName);
      this.extractPreferences(message, playerName);

      this.recentContext.push({
         player: playerName,
         message: message,
         timestamp: Date.now()
      });

      if (this.recentContext.length > 20) {
         this.recentContext.shift();
      }
   }

   extractTopics(message, playerName) {
      const lowerMessage = message.toLowerCase();
      const conv = this.conversations.get(playerName);

      const topicKeywords = {
         mining: ['mine','mining', 'diamond', 'gold', 'iron', 'copper' 'ore', 'cave', 'strip'],
         building: ['build','make', 'house', 'base', 'construct', 'design'],
         farming: ['farm', 'farming', 'grow', 'crop', 'crops 'wheat', 'food', 'animal'],
         pvp: ['pvp', 'fight', 'combat', 'arena', 'battle'],
         trading: ['trade', 'sell', 'buy', 'shop', 'market'],
         exploring: ['explore', 'travel', 'adventure', 'journey', 'discover'],
         redstone: ['redstone', 'circuit', 'piston', 'contraption'],
         enchanting: ['enchant', 'xp', 'level', 'anvil', 'book']
      };

      for (const [topic, keywords] of Object.entries(topicKeywords)) {
         if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            conv.topics.add(topic);
            
            if (!this.topics.has(topic)) {
               this.topics.set(topic, new Set());
            }
            this.topics.get(topic).add(playerName);
         }
      }
   }

   extractPreferences(message, playerName) {
      const lowerMessage = message.toLowerCase();
      const conv = this.conversations.get(playerName);

      if (lowerMessage.includes('love') || lowerMessage.includes('favorite')) {
         if (lowerMessage.includes('mining')) conv.preferences.favoriteActivity = 'mining';
         if (lowerMessage.includes('building')) conv.preferences.favoriteActivity = 'building';
         if (lowerMessage.includes('pvp')) conv.preferences.favoriteActivity = 'pvp';
      }

      if (lowerMessage.includes('looking for') || lowerMessage.includes('need')) {
         conv.preferences.currentGoal = message;
         conv.preferences.goalTimestamp = Date.now();
      }

      if (lowerMessage.includes('help') || lowerMessage.includes('how do')) {
         conv.preferences.needsHelp = true;
         conv.preferences.helpTopic = message;
      }
   }

   getConversationContext(playerName) {
      if (!this.conversations.has(playerName)) {
         return null;
      }

      const conv = this.conversations.get(playerName);
      
      if (Date.now() - conv.lastInteraction > this.maxConversationAge) {
         return null;
      }

      return {
         recentMessages: conv.messages.slice(-5),
         topics: Array.from(conv.topics),
         preferences: conv.preferences,
         messageCount: conv.messageCount,
         timeSinceLastInteraction: Date.now() - conv.lastInteraction
      };
   }

   getRelevantContext(currentMessage) {
      const lowerMessage = currentMessage.toLowerCase();
      const relevantMessages = [];

      for (const ctx of this.recentContext.slice(-10)) {
         if (this.isContextRelevant(ctx.message, currentMessage)) {
            relevantMessages.push(ctx);
         }
      }

      return relevantMessages;
   }

   isContextRelevant(previousMessage, currentMessage) {
      const prev = previousMessage.toLowerCase();
      const curr = currentMessage.toLowerCase();

      const sharedWords = prev.split(' ').filter(word => 
         word.length > 3 && curr.includes(word)
      );

      return sharedWords.length > 0;
   }

   getPlayerTopics(playerName) {
      const conv = this.conversations.get(playerName);
      return conv ? Array.from(conv.topics) : [];
   }

   isPlayerInterestedIn(playerName, topic) {
      const conv = this.conversations.get(playerName);
      return conv ? conv.topics.has(topic) : true;
   }

   cleanup() {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000;

      for (const [playerName, conv] of this.conversations.entries()) {
         if (now - conv.lastInteraction > maxAge) {
            this.conversations.delete(playerName);
         }
      }

      this.recentContext = this.recentContext.filter(
         ctx => now - ctx.timestamp < 3600000
      );
   }

   getStats() {
      return {
         totalConversations: this.conversations.size,
         totalTopics: this.topics.size,
         recentContextSize: this.recentContext.length,
         activeConversations: Array.from(this.conversations.values())
            .filter(conv => Date.now() - conv.lastInteraction < 600000).length
      };
   }
}

module.exports = ConversationTracker;
