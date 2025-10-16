class BotResponses {
   constructor(botName, serverName, config = {}, conversationTracker = null) {
      this.botName = botName;
      this.serverName = serverName;
      this.config = config;
      this.conversationTracker = conversationTracker;
      this.lastResponses = [];
      this.conversationContext = new Map();
      this.playerStats = new Map();
      this.serverStartTime = Date.now();
      this.responseHistory = [];
      this.lastResponseTime = 0;
      this.rateLimitDelay = config.rateLimitDelay || 2000;
   }

   async shouldRespondToMessage(message, playerName) {
      if (!this.config.enabled) return false;
      
      const now = Date.now();
      if (now - this.lastResponseTime < this.rateLimitDelay) {
         return false;
      }
      
      const lowerMessage = message.toLowerCase();
      const lowerBotName = this.botName.toLowerCase();
      
      if (lowerMessage.includes('bot') && !lowerMessage.includes(lowerBotName)) return false;
      
      if (lowerMessage.includes(lowerBotName)) return true;
      
      if (!this.config.answerQuestions) {
         return lowerMessage.includes(lowerBotName);
      }
      
      if (lowerMessage.startsWith('!') || lowerMessage.startsWith('/help')) return true;
      
      if (lowerMessage.includes('welcome') || lowerMessage.includes('new here')) return true;
      if (lowerMessage.includes('rules') || lowerMessage.includes('rule')) return Math.random() < 0.75;
      if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('command')) return Math.random() < 0.7;
      if (lowerMessage.includes('?') && (lowerMessage.includes('what') || lowerMessage.includes('where') || lowerMessage.includes('how'))) return Math.random() < 0.5;
      if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) return Math.random() < 0.6;
      if (lowerMessage.includes('discord') || lowerMessage.includes('website')) return Math.random() < 0.6;
      if (lowerMessage.includes('admin') || lowerMessage.includes('mod')) return Math.random() < 0.4;
      
      return Math.random() < 0.08;
   }

   async generateResponse(playerMessage, playerName) {
      const lowerMessage = playerMessage.toLowerCase();
      
      this.trackPlayerActivity(playerName);
      this.lastResponseTime = Date.now();

      if (this.conversationTracker) {
         this.conversationTracker.addMessage(playerName, playerMessage, false);
      }

      const context = this.conversationTracker ? 
         this.conversationTracker.getConversationContext(playerName) : null;

      if (context && context.preferences && context.preferences.favoriteActivity) {
         if (lowerMessage.includes(context.preferences.favoriteActivity)) {
            return this.getContextAwareResponse(playerName, context);
         }
      }
      
      if (lowerMessage.includes('rules') || lowerMessage.includes('rule')) {
         return this.getRandomResponse(this.getRulesResponses());
      }
      
      if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('commands')) {
         return this.getRandomResponse(this.getHelpResponses());
      }
      
      if (lowerMessage.includes('welcome') || lowerMessage.includes('new here') || lowerMessage.includes('first time')) {
         return this.getRandomResponse(this.getWelcomeResponses(playerName));
      }
      
      if (lowerMessage.includes('discord') || lowerMessage.includes('website') || lowerMessage.includes('link') || lowerMessage.includes('url')) {
         return this.getRandomResponse(this.getServerInfoResponses());
      }
      
      if (lowerMessage.includes('admin') || lowerMessage.includes('mod') || lowerMessage.includes('staff')) {
         return this.getRandomResponse(this.getAdminResponses());
      }
      
      if (this.config.provideTips) {
         if (lowerMessage.includes('diamond') || lowerMessage.includes('ore') || lowerMessage.includes('mine') || lowerMessage.includes('mining')) {
            return this.getRandomResponse(this.getMiningTips());
         }
         
         if (lowerMessage.includes('build') || lowerMessage.includes('base') || lowerMessage.includes('house') || lowerMessage.includes('construction')) {
            return this.getRandomResponse(this.getBuildingTips());
         }
         
         if (lowerMessage.includes('spawn') || lowerMessage.includes('where') || lowerMessage.includes('location') || lowerMessage.includes('coordinates')) {
            return this.getRandomResponse(this.getLocationHelp());
         }
         
         if (lowerMessage.includes('farm') || lowerMessage.includes('crop') || lowerMessage.includes('food')) {
            return this.getRandomResponse(this.getFarmingTips());
         }
         
         if (lowerMessage.includes('pvp') || lowerMessage.includes('fight') || lowerMessage.includes('combat')) {
            return this.getRandomResponse(this.getCombatTips());
         }
         
         if (lowerMessage.includes('enchant') || lowerMessage.includes('xp') || lowerMessage.includes('experience')) {
            return this.getRandomResponse(this.getEnchantmentTips());
         }
      }
      
      if (lowerMessage.includes('?')) {
         return this.getRandomResponse(this.getQuestionResponses());
      }
      
      if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey') || lowerMessage.includes('sup')) {
         return this.getRandomResponse(this.getGreetingResponses(playerName));
      }
      
      if (lowerMessage.includes('thanks') || lowerMessage.includes('thank')) {
         return this.getRandomResponse(this.getThankYouResponses());
      }
      
      if (lowerMessage.includes('bye') || lowerMessage.includes('leaving') || lowerMessage.includes('gotta go')) {
         return this.getRandomResponse(this.getGoodbyeResponses(playerName));
      }
      
      if (lowerMessage.includes(this.botName.toLowerCase())) {
         return this.getRandomResponse(this.getDirectMentionResponses());
      }
      
      return this.getRandomResponse(this.getCasualResponses());
   }

   getRulesResponses() {
      return [
         "Main rules: No griefing, no stealing, and respect everyone on the server!",
         "Remember the golden rules: PvP only in designated arenas, absolutely no cheating, and always be friendly to other players!",
         "Server rules are simple: Build at least 100 blocks away from others, no hacks or exploits, and most importantly, have fun!",
         "Key rules to follow: Respect other players' builds, always ask before entering someone's base, and play fair!",
         "Important rules: No spam in chat, no toxic behavior, and try to work together when possible!",
         "Basic rules: Be respectful, don't grief or steal, ask permission before taking items, and help new players!",
         "Server guidelines: Keep chat friendly, report any issues to admins, and respect everyone's property!",
         "The main thing is: treat others how you want to be treated, no griefing, and follow admin instructions!"
      ];
   }

   getHelpResponses() {
      return [
         "Need help? Feel free to ask admins or check /spawn for information boards with detailed guides!",
         "Try using /sethome to save your base location so you can teleport back anytime!",
         "Use /tpa [playername] to send a teleport request to your friends!",
         "Type /help in chat to see all available commands on this server!",
         "For beginner tips and tutorials, head to spawn - there's usually a guide area with signs!",
         "Stuck somewhere? Try /back to return to your last location before you died or teleported!",
         "Type /warp to see all available warp locations you can teleport to instantly!",
         "Most servers have /spawn, /sethome, /home, /tpa, and /back commands. Try those first!",
         "Check the server website or Discord for detailed command lists and tutorials!",
         "Pro tip: Use /help followed by a topic name to get specific help on that feature!"
      ];
   }

   getWelcomeResponses(playerName) {
      return [
         `Welcome to ${this.serverName}, ${playerName}! Really glad to have you here!`,
         `Hey ${playerName}! First time on the server? Feel free to explore and ask if you need anything!`,
         `Welcome ${playerName}! Check out spawn for starter kits and information about the server!`,
         `Nice to meet you ${playerName}! Need any help getting started? Just ask!`,
         `Hey ${playerName}! This server has an amazing community, you're going to love it here!`,
         `Welcome aboard ${playerName}! Make sure to read the rules at spawn and then have fun building!`,
         `${playerName} just joined! Welcome! Head to spawn for supplies and guides to get started!`,
         `Hey ${playerName}! New here? Don't hesitate to ask questions, everyone's super helpful!`
      ];
   }

   getServerInfoResponses() {
      return [
         "Join our Discord server for updates, events, and to connect with the community!",
         "Visit our website for complete server rules, news, and upcoming events!",
         "Check out the forums at our website for detailed guides and tutorials!",
         "The Discord link is usually in the server description or at spawn!",
         "Find all server info, rules, and links at spawn - just type /spawn!",
         "Our Discord has channels for trading, building showcases, and getting help!",
         "The website has a complete wiki with guides for everything on this server!",
         "For the latest updates and announcements, join the Discord community!"
      ];
   }

   getAdminResponses() {
      return [
         "Admins are usually available in Discord if you need help with something important!",
         "For admin help, try reaching out in Discord or using /helpop if the server has it!",
         "Staff members are marked with special tags or colors in chat!",
         "If you see someone breaking rules, report it to admins via Discord or /report!",
         "Admins can help with griefing issues, rollbacks, and technical problems!",
         "Most admins are active in Discord even when not online in-game!"
      ];
   }

   getMiningTips() {
      return [
         "Best diamonds are found around Y: -59 to Y: -64 in version 1.18+!",
         "Branch mining at Y: 11 is still great for finding most ores efficiently!",
         "Always bring plenty of torches, food, and a water bucket when mining!",
         "Iron ore is super common around Y: 16, perfect for getting tools and armor!",
         "Strip mining at diamond level is the most efficient way to find rare ores!",
         "Ancient debris spawns around Y: 15 in the Nether, use beds or TNT to find it!",
         "Pro tip: Mine in straight lines with 2 blocks between each tunnel for maximum coverage!",
         "Don't dig straight down! Always keep a water bucket handy for safety!",
         "Bring a Fortune III pickaxe for diamonds to get more per ore block!",
         "Mining in caves can be faster but more dangerous - bring good armor!"
      ];
   }

   getBuildingTips() {
      return [
         "Add depth to your builds using stairs, slabs, and different block textures!",
         "Mix 2-3 different block types for better texture variation and detail!",
         "Lighting is crucial - it prevents mob spawns and makes builds look better at night!",
         "Always plan your base layout on paper before starting a huge build!",
         "Look at other players' builds for inspiration and learn new techniques!",
         "Use trapdoors, buttons, and pressure plates as decoration elements!",
         "Try building in odd dimensions (like 7x9) instead of squares for more interesting shapes!",
         "Add greenery around your builds with custom trees and gardens!",
         "Use different roof styles and overhangs to make buildings more dynamic!",
         "Don't make walls flat - add window sills, pillars, and other depth elements!"
      ];
   }

   getLocationHelp() {
      return [
         "Type /spawn to teleport back to the spawn point instantly!",
         "Use /sethome at your base location to save it, then /home to return anytime!",
         "Press F3 (or Fn+F3) to see your exact coordinates in the game!",
         "Spawn is usually located at coordinates 0, 0 in the world!",
         "Build a nether portal for fast travel - 8 blocks in overworld = 1 in nether!",
         "Mark your base coordinates in a book or write them down somewhere safe!",
         "Use landmarks like tall towers with torches to find your way back!",
         "Craft a compass - it always points to world spawn, super useful for navigation!"
      ];
   }

   getFarmingTips() {
      return [
         "Wheat, carrots, and potatoes grow faster with water nearby and good lighting!",
         "Bone meal from skeletons instantly grows crops - super useful for farming!",
         "Build your farm near water sources for automatic hydration!",
         "Villagers can be used for automatic farming if you set up the right system!",
         "Pumpkins and melons need empty space next to the stem to grow!",
         "Use a Fortune III hoe for better crop yields when harvesting!",
         "Automated farms with hoppers and water can save you tons of time!",
         "Breed animals for renewable food sources - much better than hunting!"
      ];
   }

   getCombatTips() {
      return [
         "Always keep a shield in your off-hand for blocking attacks!",
         "Critical hits deal more damage - jump and hit while falling!",
         "Strafe (move side to side) while fighting to avoid taking damage!",
         "Enchant your armor with Protection IV for maximum defense!",
         "Bring healing potions and golden apples to tough fights!",
         "Practice PvP in designated arenas before fighting for real!",
         "Sharpness V and Sweeping Edge are great sword enchantments!",
         "Learn to combo - hit right after your cooldown resets for maximum DPS!"
      ];
   }

   getEnchantmentTips() {
      return [
         "Build an AFK fish farm for enchanted books while you're away!",
         "Level 30 enchantments give the best enchants, but cost more lapis!",
         "Use a grindstone to remove unwanted enchants and get some XP back!",
         "Combine books in an anvil to build up powerful multi-enchant tools!",
         "Mending is one of the best enchantments - find it from villager trading!",
         "Set up an XP farm with spawners or mob farms for easy leveling!",
         "Librarian villagers are the best source for specific enchantment books!"
      ];
   }

   getQuestionResponses() {
      return [
         "That's a good question! Let me think about that for a moment...",
         "Hmm, not 100% sure about that one, but I can try to help you figure it out!",
         "That's something worth asking an admin about for a definitive answer!",
         "Interesting question! Try asking in chat - someone more experienced probably knows!",
         "I'm not totally sure about that, but checking the wiki or Discord might help!",
         "That's a great question! An admin or moderator would know the answer for sure!",
         "Good question! Maybe check /help or the information boards at spawn?",
         "Not entirely sure, but other players here might know - try asking around!"
      ];
   }

   getGreetingResponses(playerName) {
      return [
         `Hey ${playerName}! How's your day going so far?`,
         `Hi ${playerName}! Good to see you online! What are you working on?`,
         `Hello ${playerName}! What projects are you working on today?`,
         `Hey there ${playerName}! Welcome back to the server!`,
         `Hi ${playerName}! Great to see you again! How have you been?`,
         `Hey! How's everything going ${playerName}?`,
         `Hello there! Good to see you ${playerName}!`,
         `Hi ${playerName}! Hope you're having an awesome day!`,
         `Hey ${playerName}! Ready for some building and mining?`,
         `What's up ${playerName}! Good to have you back!`
      ];
   }

   getThankYouResponses() {
      return [
         "No problem at all, always happy to help out!",
         "Anytime! That's what we're all here for - helping each other!",
         "You're very welcome! Enjoy the server and have fun building!",
         "Glad I could help! Feel free to ask anytime!",
         "No worries! Have an awesome time on the server!",
         "Happy to help out! That's what community is all about!",
         "You're welcome! Don't hesitate to ask if you need anything else!",
         "Of course! Always here if you need help with anything!"
      ];
   }

   getGoodbyeResponses(playerName) {
      return [
         `See you later ${playerName}! Have a great rest of your day!`,
         `Bye ${playerName}! Come back soon!`,
         `Later ${playerName}! Take care and see you next time!`,
         `Goodbye ${playerName}! Thanks for playing on the server!`,
         `See ya ${playerName}! Hope to see you again soon!`,
         `Take it easy ${playerName}! Catch you later!`,
         `Bye! Have a good one ${playerName}!`,
         `Later! Come back anytime ${playerName}!`
      ];
   }

   getDirectMentionResponses() {
      return [
         "Yeah? What's up! How can I help?",
         "Hey! Need something? I'm here to help!",
         "I'm here! What do you need?",
         "What's going on? Need help with something?",
         "Yeah, I'm listening! What can I do for you?",
         "Hey! What did you want to ask?",
         "Yep, that's me! What's up?",
         "I'm here! How can I assist you?"
      ];
   }

   getCasualResponses() {
      return [
         "That sounds really fun! I'd love to see how it turns out!",
         "Oh that's pretty cool! Nice work!",
         "Awesome stuff! Keep up the great building!",
         "Yeah, I totally agree with that!",
         "Sounds like a solid plan to me!",
         "That's actually pretty neat! Good idea!",
         "Cool, cool! That should work well!",
         "Interesting approach! I like it!",
         "Nice work on that! Looking good!",
         "That's great! Keep it up!",
         "Oh wow, that's actually really impressive!",
         "Sounds like you're making good progress!",
         "That's a smart way to do it!",
         "I like that idea! Very creative!"
      ];
   }

   generatePromoMessage() {
      const uptime = this.getUptime();
      const playerCount = this.playerStats.size;
      
      const messages = [
         `Welcome to ${this.serverName}! We've been running strong for ${uptime}!`,
         `${this.serverName} - Building an amazing community together, one block at a time!`,
         `Having such a great time on ${this.serverName}! This community is awesome!`,
         `${playerCount} awesome players have joined today! Come be part of our growing community!`,
         "The community here is incredibly friendly and always willing to help!",
         `${this.serverName} has some really cool features and events - check them out!`,
         "Anyone want to team up and build something epic together?",
         "This is a great server for both new players and veterans!",
         "Really enjoying the survival experience here - fair gameplay and great people!",
         `${this.serverName} is definitely one of the best servers for multiplayer survival!`,
         "Check out the awesome builds around spawn - so much talent here!",
         "Remember: respect everyone's builds and hard work, and let's all have fun together!",
         "Pro tip: Don't forget to set your home point with /sethome for easy travel!",
         "Server tip: Use /tpa to teleport to friends and explore together!",
         "Exciting events coming soon - make sure to join the Discord to stay updated!",
         "Built something cool? Share screenshots in the Discord community!",
         "Need help with anything? The admins and players here are super helpful and friendly!",
         "New to the server? Check out the helpful guide boards at spawn to get started!",
         "The trading system here is great - fair deals and honest players!",
         "Love the anti-grief protection on this server - build with confidence!",
         `What makes ${this.serverName} special? Amazing community, active admins, and fair gameplay!`,
         "This server has the perfect balance of survival challenge and player-friendly features!",
         "Been playing here for a while now - consistently great experience!",
         "The plugin setup here is perfect - useful features without being overwhelming!"
      ];
      
      return messages[Math.floor(Math.random() * messages.length)];
   }

   getContextAwareResponse(playerName, context) {
      const activity = context.preferences.favoriteActivity;
      const responses = {
         mining: [
            `You're into mining, right ${playerName}? Found any good ores lately?`,
            `Still working on that mining project ${playerName}?`,
            `How's the mining going today ${playerName}?`
         ],
         building: [
            `How's your build coming along ${playerName}?`,
            `Working on any cool builds today ${playerName}?`,
            `I'd love to see what you're building ${playerName}!`
         ],
         pvp: [
            `Ready for some PvP action ${playerName}?`,
            `Been practicing your combat skills ${playerName}?`,
            `How's the PvP training going ${playerName}?`
         ]
      };

      return responses[activity] ? 
         this.getRandomResponse(responses[activity]) : 
         this.getRandomResponse(this.getCasualResponses());
   }

   getRandomResponse(responses) {
      const availableResponses = responses.filter(r => !this.lastResponses.includes(r));
      const responsePool = availableResponses.length > 0 ? availableResponses : responses;
      const response = responsePool[Math.floor(Math.random() * responsePool.length)];
      
      this.lastResponses.push(response);
      if (this.lastResponses.length > 8) {
         this.lastResponses.shift();
      }
      
      if (this.conversationTracker && response) {
         this.conversationTracker.addMessage(this.botName, response, true);
      }
      
      return response;
   }

   trackPlayerActivity(playerName) {
      const now = Date.now();
      if (!this.playerStats.has(playerName)) {
         this.playerStats.set(playerName, {
            firstSeen: now,
            lastSeen: now,
            messageCount: 1,
            isNew: true
         });
      } else {
         const stats = this.playerStats.get(playerName);
         stats.lastSeen = now;
         stats.messageCount++;
         stats.isNew = true;
      }
   }

   getUptime() {
      const uptime = Date.now() - this.serverStartTime;
      const hours = Math.floor(uptime / (1000 * 60 * 60));
      if (hours < 1) return "just a short while";
      if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      const days = Math.floor(hours / 24);
      return `${days} ${days === 1 ? 'day' : 'days'}`;
   }

   getWelcomeMessage(playerName) {
      if (!this.config.enabled || !this.config.welcomeNewPlayers) return null;
      
      const isNewPlayer = !this.playerStats.has(playerName);
      if (isNewPlayer) {
         return `Welcome to ${this.serverName}, ${playerName}! Type 'help' if you need anything, we're here to assist!`;
      } else {
         const stats = this.playerStats.get(playerName);
         const timeSinceLastSeen = Date.now() - stats.lastSeen;
         const hours = Math.floor(timeSinceLastSeen / (1000 * 60 * 60));
         
         if (hours > 48) {
            const days = Math.floor(hours / 24);
            return `Welcome back ${playerName}! It's been ${days} ${days === 1 ? 'day' : 'days'}! Good to see you again!`;
         } else if (hours > 24) {
            return `Hey ${playerName}! Haven't seen you since yesterday! Welcome back!`;
         }
      }
      return null;
   }
}

module.exports = BotResponses;
