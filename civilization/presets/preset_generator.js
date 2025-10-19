/**
 * Preset Generator - Creates civilization configurations
 */

const fs = require('fs');
const path = require('path');

class PresetGenerator {
  constructor() {
    this.presetsFile = path.join(__dirname, 'civilization_presets.json');
    this.presets = this._loadPresets();
  }

  _loadPresets() {
    try {
      const data = fs.readFileSync(this.presetsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load presets:', error.message);
      return { presets: {}, personalities_library: {}, role_configurations: {} };
    }
  }

  /**
   * Get list of available presets
   */
  getAvailablePresets() {
    return Object.keys(this.presets.presets).map(key => ({
      id: key,
      name: this.presets.presets[key].name,
      description: this.presets.presets[key].description,
      botCount: this.presets.presets[key].botCount
    }));
  }

  /**
   * Generate complete bot configuration for a preset
   */
  generatePreset(presetId, serverConfig = {}) {
    const preset = this.presets.presets[presetId];
    if (!preset) {
      throw new Error(`Preset '${presetId}' not found`);
    }

    const bots = [];
    
    // If preset has predefined bots, use them
    if (preset.bots && preset.bots.length > 0) {
      for (const botConfig of preset.bots) {
        bots.push(this._createBotConfig(botConfig, serverConfig));
      }
    } else {
      // Generate bots automatically based on count
      bots.push(...this._generateBotsForCount(preset.botCount, serverConfig));
    }

    return {
      preset: preset.name,
      description: preset.description,
      botCount: bots.length,
      bots: bots,
      server: serverConfig
    };
  }

  /**
   * Create bot configuration with personality and role
   */
  _createBotConfig(botTemplate, serverConfig) {
    const personality = this.presets.personalities_library[botTemplate.personality] || 
                       this.presets.personalities_library['default'];
    
    const role = this.presets.role_configurations[botTemplate.role] || {};

    return {
      id: botTemplate.id,
      name: botTemplate.name,
      host: serverConfig.host || 'localhost',
      port: serverConfig.port || 25565,
      version: serverConfig.version || '1.20.1',
      personality: personality,
      role: {
        title: botTemplate.role,
        priority: role.priority || 5,
        preferredActions: botTemplate.priority_actions || role.actions || [],
        skills: role.skills || []
      }
    };
  }

  /**
   * Auto-generate bots for large civilizations
   */
  _generateBotsForCount(count, serverConfig) {
    const bots = [];
    const roleDistribution = this._calculateRoleDistribution(count);
    
    let botIndex = 1;
    
    for (const [role, roleCount] of Object.entries(roleDistribution)) {
      const personality = this._getRolePersonality(role);
      
      for (let i = 0; i < roleCount; i++) {
        bots.push(this._createBotConfig({
          id: `bot_${String(botIndex).padStart(3, '0')}`,
          name: `${this._getRoleName(role)}_${i + 1}`,
          personality: personality,
          role: role
        }, serverConfig));
        
        botIndex++;
      }
    }
    
    return bots;
  }

  /**
   * Calculate optimal role distribution for civilization size
   */
  _calculateRoleDistribution(botCount) {
    const distribution = {};
    
    // Base ratios (percentages)
    const ratios = {
      construction: 0.20,      // 20% builders
      farmer: 0.15,            // 15% farmers
      miner: 0.15,             // 15% miners
      explorer: 0.10,          // 10% explorers
      diplomat: 0.10,          // 10% diplomats
      trader: 0.10,            // 10% traders
      guard: 0.10,             // 10% guards
      resource_collector: 0.10 // 10% general gatherers
    };
    
    for (const [role, ratio] of Object.entries(ratios)) {
      distribution[role] = Math.max(1, Math.floor(botCount * ratio));
    }
    
    // Adjust to match exact count
    let total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    if (total < botCount) {
      distribution.construction += (botCount - total);
    }
    
    return distribution;
  }

  _getRolePersonality(role) {
    const mapping = {
      construction: 'builder',
      chief_builder: 'builder',
      head_farmer: 'gatherer',
      farmer: 'gatherer',
      chief_miner: 'gatherer',
      miner: 'gatherer',
      chief_explorer: 'explorer',
      explorer: 'explorer',
      diplomat: 'social',
      trader: 'social',
      guard: 'default',
      resource_collector: 'gatherer'
    };
    
    return mapping[role] || 'default';
  }

  _getRoleName(role) {
    const names = {
      construction: 'Builder',
      farmer: 'Farmer',
      miner: 'Miner',
      explorer: 'Scout',
      diplomat: 'Envoy',
      trader: 'Merchant',
      guard: 'Guard',
      resource_collector: 'Gatherer'
    };
    
    return names[role] || 'Citizen';
  }

  /**
   * Save generated configuration to file
   */
  saveConfiguration(presetId, serverConfig, outputPath) {
    const config = this.generatePreset(presetId, serverConfig);
    
    const outputFile = outputPath || path.join(__dirname, `../config/${presetId}_config.json`);
    fs.writeFileSync(outputFile, JSON.stringify(config, null, 2), 'utf8');
    
    console.log(`Configuration saved to: ${outputFile}`);
    console.log(`Civilization: ${config.preset}`);
    console.log(`Bots: ${config.botCount}`);
    
    return outputFile;
  }
}

module.exports = PresetGenerator;
