class VillageSystem {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    
    this.MIN_TRUST_FOR_VILLAGE = 0.6;
    this.MIN_BOTS_FOR_VILLAGE = 2;
    this.TERRITORY_RADIUS = 50;
  }

  checkVillageFormation() {
    try {
      const bots = this.db.getAllBots();
      const relationships = this.db.getAllRelationships();
      
      const clusters = this._findBotClusters(bots, relationships);
      
      for (const cluster of clusters) {
        if (cluster.bots.length >= this.MIN_BOTS_FOR_VILLAGE) {
          const avgTrust = cluster.avgTrust;
          
          if (avgTrust >= this.MIN_TRUST_FOR_VILLAGE) {
            const existing = this._findVillageForBots(cluster.bots);
            
            if (!existing) {
              this._createVillage(cluster);
            } else {
              this._expandVillage(existing.id, cluster.bots);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('[Village] Formation check failed:', error.message);
    }
  }

  _findBotClusters(bots, relationships) {
    const clusters = [];
    const processed = new Set();
    
    for (const bot of bots) {
      if (processed.has(bot.id)) continue;
      
      const cluster = {
        bots: [bot],
        botIds: new Set([bot.id]),
        totalTrust: 0,
        trustCount: 0
      };
      
      const nearbyBots = this._findNearbyBots(bot, bots);
      
      for (const nearby of nearbyBots) {
        if (processed.has(nearby.id)) continue;
        
        const rel = relationships.find(r => 
          (r.bot_id_1 === bot.id && r.bot_id_2 === nearby.id) ||
          (r.bot_id_2 === bot.id && r.bot_id_1 === nearby.id)
        );
        
        if (rel && rel.trust_level >= this.MIN_TRUST_FOR_VILLAGE * 0.8) {
          cluster.bots.push(nearby);
          cluster.botIds.add(nearby.id);
          cluster.totalTrust += rel.trust_level;
          cluster.trustCount++;
        }
      }
      
      cluster.avgTrust = cluster.trustCount > 0 ? cluster.totalTrust / cluster.trustCount : 0;
      
      if (cluster.bots.length > 1) {
        clusters.push(cluster);
        cluster.bots.forEach(b => processed.add(b.id));
      }
    }
    
    return clusters;
  }

  _findNearbyBots(bot, allBots) {
    if (!bot.position_x) return [];
    
    return allBots.filter(other => {
      if (other.id === bot.id || !other.position_x) return false;
      
      const distance = Math.sqrt(
        Math.pow(bot.position_x - other.position_x, 2) +
        Math.pow(bot.position_z - other.position_z, 2)
      );
      
      return distance <= this.TERRITORY_RADIUS;
    });
  }

  _findVillageForBots(bots) {
    const villages = this.db.getAllVillages();
    
    for (const village of villages) {
      const members = this.db.getVillageMembers(village.id);
      
      for (const bot of bots) {
        if (members.some(m => m.id === bot.id)) {
          return village;
        }
      }
    }
    
    return null;
  }

  _createVillage(cluster) {
    try {
      const centerBot = cluster.bots[0];
      const centerX = cluster.bots.reduce((sum, b) => sum + (b.position_x || 0), 0) / cluster.bots.length;
      const centerZ = cluster.bots.reduce((sum, b) => sum + (b.position_z || 0), 0) / cluster.bots.length;
      
      const villageName = this._generateVillageName(cluster);
      
      const villageId = this.db.createVillage({
        name: villageName,
        center_x: centerX,
        center_z: centerZ,
        radius: this.TERRITORY_RADIUS,
        population: cluster.bots.length
      });
      
      for (const bot of cluster.bots) {
        this.db.addBotToVillage(villageId, bot.id, 'member');
      }
      
      const leader = this._electLeader(cluster.bots);
      if (leader) {
        this.db.updateVillageMemberRole(villageId, leader.id, 'leader');
      }
      
      this.logger.info(`[Village] Created "${villageName}" with ${cluster.bots.length} members at (${Math.floor(centerX)}, ${Math.floor(centerZ)})`);
      
      for (const bot of cluster.bots) {
        this.db.addMemory(bot.id, {
          type: 'village_founded',
          village_id: villageId,
          village_name: villageName,
          role: bot.id === leader?.id ? 'leader' : 'member'
        });
      }
      
      this.db.recordCivilizationEvent({
        type: 'village_founded',
        village_id: villageId,
        village_name: villageName,
        population: cluster.bots.length
      });
      
      return villageId;
    } catch (error) {
      this.logger.error('[Village] Creation failed:', error.message);
      return null;
    }
  }

  _generateVillageName(cluster) {
    const prefixes = [
      'New', 'Old', 'North', 'South', 'East', 'West',
      'Upper', 'Lower', 'Great', 'Little', 'Hidden'
    ];
    
    const suffixes = [
      'Haven', 'Ridge', 'Valley', 'Creek', 'Hill',
      'Bridge', 'Ford', 'Grove', 'Dale', 'Hollow',
      'Point', 'Springs', 'Falls', 'Meadow', 'Glen'
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }

  _electLeader(bots) {
    let bestCandidate = null;
    let bestScore = -1;
    
    for (const bot of bots) {
      const personality = this.db.getPersonality(bot.id);
      
      if (!personality) continue;
      
      const leadershipScore = 
        (personality.ambition || 0.5) * 0.4 +
        (personality.sociability || 0.5) * 0.3 +
        (personality.work_ethic || 0.5) * 0.2 +
        (personality.empathy || 0.5) * 0.1;
      
      const relationships = this.db.getRelationships(bot.id);
      const avgTrust = relationships.length > 0
        ? relationships.reduce((sum, r) => sum + r.trust_level, 0) / relationships.length
        : 0.5;
      
      const totalScore = leadershipScore * 0.7 + avgTrust * 0.3;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestCandidate = bot;
      }
    }
    
    this.logger.info(`[Village] Elected ${bestCandidate?.name} as leader (score: ${bestScore.toFixed(2)})`);
    
    return bestCandidate;
  }

  _expandVillage(villageId, newBots) {
    try {
      const village = this.db.getVillage(villageId);
      const currentMembers = this.db.getVillageMembers(villageId);
      
      let added = 0;
      
      for (const bot of newBots) {
        if (!currentMembers.some(m => m.id === bot.id)) {
          this.db.addBotToVillage(villageId, bot.id, 'member');
          added++;
          
          this.db.addMemory(bot.id, {
            type: 'joined_village',
            village_id: villageId,
            village_name: village.name
          });
        }
      }
      
      if (added > 0) {
        this.db.updateVillage(villageId, {
          population: currentMembers.length + added
        });
        
        this.logger.info(`[Village] ${village.name} expanded by ${added} members`);
        
        this.db.recordCivilizationEvent({
          type: 'village_expanded',
          village_id: villageId,
          village_name: village.name,
          new_members: added
        });
      }
      
      return added;
    } catch (error) {
      this.logger.error('[Village] Expansion failed:', error.message);
      return 0;
    }
  }

  assignRole(villageId, botId, role) {
    try {
      const validRoles = ['leader', 'builder', 'farmer', 'miner', 'guard', 'trader', 'member'];
      
      if (!validRoles.includes(role)) {
        return { success: false, reason: 'invalid_role' };
      }

      this.db.updateVillageMemberRole(villageId, botId, role);
      
      this.db.addMemory(botId, {
        type: 'role_assigned',
        village_id: villageId,
        role: role
      });
      
      this.logger.info(`[Village] Assigned role "${role}" to bot ${botId}`);
      
      return { success: true, role };
    } catch (error) {
      this.logger.error('[Village] Role assignment failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  contributeResources(villageId, botId, resources) {
    try {
      for (const resource of resources) {
        this.db.addVillageResource(villageId, resource.name, resource.amount);
      }
      
      this.db.addMemory(botId, {
        type: 'contributed_resources',
        village_id: villageId,
        resources: resources
      });
      
      const village = this.db.getVillage(villageId);
      this.logger.info(`[Village] ${village.name} received resources from bot ${botId}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error('[Village] Resource contribution failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  requestResources(villageId, botId, needed) {
    try {
      const villageResources = this.db.getVillageResources(villageId);
      const granted = [];
      
      for (const need of needed) {
        const available = villageResources.find(r => r.resource_type === need.name);
        
        if (available && available.amount >= need.amount) {
          granted.push(need);
          this.db.updateVillageResource(villageId, need.name, -need.amount);
        }
      }
      
      if (granted.length > 0) {
        this.db.addMemory(botId, {
          type: 'received_village_resources',
          village_id: villageId,
          resources: granted
        });
      }
      
      return { success: true, granted };
    } catch (error) {
      this.logger.error('[Village] Resource request failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  proposeVillageGoal(villageId, proposerId, goal) {
    try {
      const goalId = this.db.addVillageGoal(villageId, {
        type: goal.type,
        description: goal.description,
        proposed_by: proposerId,
        status: 'proposed'
      });
      
      this.logger.info(`[Village] New goal proposed: ${goal.description}`);
      
      this.db.recordCivilizationEvent({
        type: 'village_goal_proposed',
        village_id: villageId,
        goal_id: goalId,
        description: goal.description
      });
      
      return { success: true, goalId };
    } catch (error) {
      this.logger.error('[Village] Goal proposal failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  voteOnGoal(villageId, goalId, botId, vote) {
    try {
      this.db.recordVillageGoalVote(goalId, botId, vote);
      
      const votes = this.db.getVillageGoalVotes(goalId);
      const members = this.db.getVillageMembers(villageId);
      
      const yesVotes = votes.filter(v => v.vote === 'yes').length;
      const totalVotes = votes.length;
      
      const quorum = members.length * 0.5;
      const majority = totalVotes * 0.6;
      
      if (totalVotes >= quorum && yesVotes >= majority) {
        this.db.updateVillageGoal(goalId, { status: 'active' });
        
        this.db.recordCivilizationEvent({
          type: 'village_goal_approved',
          village_id: villageId,
          goal_id: goalId
        });
        
        this.logger.info(`[Village] Goal ${goalId} approved with ${yesVotes}/${totalVotes} votes`);
      }
      
      return { success: true, yesVotes, totalVotes };
    } catch (error) {
      this.logger.error('[Village] Voting failed:', error.message);
      return { success: false, reason: error.message };
    }
  }

  isInVillageTerritory(villageId, x, z) {
    try {
      const village = this.db.getVillage(villageId);
      
      if (!village) return false;
      
      const distance = Math.sqrt(
        Math.pow(x - village.center_x, 2) +
        Math.pow(z - village.center_z, 2)
      );
      
      return distance <= village.radius;
    } catch (error) {
      return false;
    }
  }

  findVillageAt(x, z) {
    try {
      const villages = this.db.getAllVillages();
      
      for (const village of villages) {
        if (this.isInVillageTerritory(village.id, x, z)) {
          return village;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  getVillageStatistics(villageId) {
    try {
      const village = this.db.getVillage(villageId);
      const members = this.db.getVillageMembers(villageId);
      const resources = this.db.getVillageResources(villageId);
      const goals = this.db.getVillageGoals(villageId);
      
      const personalities = members.map(m => this.db.getPersonality(m.id)).filter(p => p);
      
      const avgPersonality = {
        curiosity: personalities.reduce((sum, p) => sum + (p.curiosity || 0.5), 0) / personalities.length,
        sociability: personalities.reduce((sum, p) => sum + (p.sociability || 0.5), 0) / personalities.length,
        ambition: personalities.reduce((sum, p) => sum + (p.ambition || 0.5), 0) / personalities.length
      };
      
      return {
        village,
        member_count: members.length,
        resource_count: resources.length,
        active_goals: goals.filter(g => g.status === 'active').length,
        avg_personality: avgPersonality,
        members: members.map(m => ({ id: m.id, name: m.name, role: m.role }))
      };
    } catch (error) {
      this.logger.error('[Village] Get statistics failed:', error.message);
      return null;
    }
  }
}

module.exports = VillageSystem;
