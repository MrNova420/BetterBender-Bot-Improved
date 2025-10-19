/**
 * Configuration Validator
 * Validates civilization configurations and provides helpful error messages
 */

class ConfigValidator {
  constructor(logger) {
    this.logger = logger || console;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a complete civilization configuration
   */
  validateCivilizationConfig(config) {
    this.errors = [];
    this.warnings = [];

    if (!config) {
      this.errors.push('Configuration is null or undefined');
      return this._buildResult();
    }

    // Validate bots array
    this._validateBots(config.bots);

    // Validate server configuration
    if (config.server) {
      this._validateServer(config.server);
    }

    // Validate database path
    if (config.dbPath) {
      this._validateDatabasePath(config.dbPath);
    }

    return this._buildResult();
  }

  /**
   * Validate bot configurations
   */
  _validateBots(bots) {
    if (!bots || !Array.isArray(bots)) {
      this.errors.push('Bots configuration must be an array');
      return;
    }

    if (bots.length === 0) {
      this.errors.push('At least one bot is required');
      return;
    }

    if (bots.length > 100) {
      this.warnings.push(`Large bot count (${bots.length}) may cause performance issues. Recommended: 50 or fewer`);
    }

    const botIds = new Set();
    const botNames = new Set();

    bots.forEach((bot, index) => {
      this._validateBot(bot, index, botIds, botNames);
    });
  }

  /**
   * Validate individual bot configuration
   */
  _validateBot(bot, index, botIds, botNames) {
    const botPrefix = `Bot #${index + 1}`;

    // Required fields
    if (!bot.id) {
      this.errors.push(`${botPrefix}: Missing 'id' field`);
    } else if (botIds.has(bot.id)) {
      this.errors.push(`${botPrefix}: Duplicate bot ID '${bot.id}'`);
    } else {
      botIds.add(bot.id);
    }

    if (!bot.name) {
      this.errors.push(`${botPrefix}: Missing 'name' field`);
    } else {
      if (botNames.has(bot.name)) {
        this.warnings.push(`${botPrefix}: Duplicate bot name '${bot.name}' (allowed but may be confusing)`);
      }
      botNames.add(bot.name);

      if (bot.name.length > 16) {
        this.errors.push(`${botPrefix}: Bot name '${bot.name}' exceeds 16 characters (Minecraft limit)`);
      }

      if (!/^[a-zA-Z0-9_]+$/.test(bot.name)) {
        this.errors.push(`${botPrefix}: Bot name '${bot.name}' contains invalid characters (only letters, numbers, underscore)`);
      }
    }

    // Validate personality
    if (bot.personality) {
      this._validatePersonality(bot.personality, botPrefix);
    } else {
      this.warnings.push(`${botPrefix}: No personality defined, will use default`);
    }

    // Validate role
    if (bot.role) {
      this._validateRole(bot.role, botPrefix);
    } else {
      this.warnings.push(`${botPrefix}: No role defined`);
    }

    // Validate server connection (if present)
    if (bot.host && !this._isValidHost(bot.host)) {
      this.errors.push(`${botPrefix}: Invalid host '${bot.host}'`);
    }

    if (bot.port && (bot.port < 1 || bot.port > 65535)) {
      this.errors.push(`${botPrefix}: Invalid port ${bot.port} (must be 1-65535)`);
    }
  }

  /**
   * Validate personality configuration
   */
  _validatePersonality(personality, botPrefix) {
    const validTraits = [
      'curiosity',
      'sociability',
      'work_ethic',
      'creativity',
      'ambition',
      'empathy',
      'risk_tolerance',
      'aggression'
    ];

    for (const trait of validTraits) {
      if (personality[trait] !== undefined) {
        const value = personality[trait];
        if (typeof value !== 'number' || value < 0 || value > 1) {
          this.errors.push(`${botPrefix}: Personality trait '${trait}' must be a number between 0 and 1 (got ${value})`);
        }
      }
    }

    // Check for unknown traits
    for (const trait of Object.keys(personality)) {
      if (!validTraits.includes(trait)) {
        this.warnings.push(`${botPrefix}: Unknown personality trait '${trait}' (will be ignored)`);
      }
    }
  }

  /**
   * Validate role configuration
   */
  _validateRole(role, botPrefix) {
    if (typeof role === 'string') {
      // String role is fine
      return;
    }

    if (typeof role === 'object') {
      if (!role.title) {
        this.warnings.push(`${botPrefix}: Role object missing 'title' field`);
      }

      if (role.priority !== undefined) {
        if (typeof role.priority !== 'number' || role.priority < 0 || role.priority > 10) {
          this.errors.push(`${botPrefix}: Role priority must be a number between 0 and 10`);
        }
      }

      if (role.preferredActions && !Array.isArray(role.preferredActions)) {
        this.errors.push(`${botPrefix}: Role preferredActions must be an array`);
      }

      if (role.skills && !Array.isArray(role.skills)) {
        this.errors.push(`${botPrefix}: Role skills must be an array`);
      }
    }
  }

  /**
   * Validate server configuration
   */
  _validateServer(server) {
    if (!server.host) {
      this.errors.push('Server configuration missing host');
    } else if (!this._isValidHost(server.host)) {
      this.errors.push(`Invalid server host: ${server.host}`);
    }

    if (server.port) {
      if (typeof server.port !== 'number' || server.port < 1 || server.port > 65535) {
        this.errors.push(`Invalid server port: ${server.port} (must be 1-65535)`);
      }
    }

    if (server.version) {
      if (typeof server.version !== 'string') {
        this.errors.push('Server version must be a string');
      }
    }
  }

  /**
   * Validate database path
   */
  _validateDatabasePath(dbPath) {
    if (typeof dbPath !== 'string') {
      this.errors.push('Database path must be a string');
      return;
    }

    if (!dbPath.endsWith('.db')) {
      this.warnings.push(`Database path '${dbPath}' does not end with .db extension`);
    }
  }

  /**
   * Check if host is valid
   */
  _isValidHost(host) {
    if (typeof host !== 'string') return false;
    
    // Allow localhost variations
    if (['localhost', '127.0.0.1', '::1'].includes(host)) return true;
    
    // Simple domain/IP validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    
    return domainRegex.test(host) || ipRegex.test(host);
  }

  /**
   * Build validation result
   */
  _buildResult() {
    const isValid = this.errors.length === 0;

    return {
      valid: isValid,
      errors: this.errors,
      warnings: this.warnings,
      summary: this._generateSummary(isValid)
    };
  }

  /**
   * Generate human-readable summary
   */
  _generateSummary(isValid) {
    if (isValid && this.warnings.length === 0) {
      return '✅ Configuration is valid';
    }

    if (isValid && this.warnings.length > 0) {
      return `⚠️  Configuration is valid with ${this.warnings.length} warning(s)`;
    }

    return `❌ Configuration is invalid with ${this.errors.length} error(s)`;
  }

  /**
   * Print validation results to console
   */
  printResults(result) {
    console.log('\n========================================');
    console.log('📋 Configuration Validation Report');
    console.log('========================================\n');

    console.log(result.summary);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (result.valid) {
      console.log('\n✅ Configuration can be used to start civilization\n');
    } else {
      console.log('\n❌ Please fix errors before starting civilization\n');
    }

    return result.valid;
  }
}

module.exports = ConfigValidator;

// CLI usage
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');

  const configPath = process.argv[2] || './config/active_civilization.json';

  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    const validator = new ConfigValidator();
    const result = validator.validateCivilizationConfig(config);
    validator.printResults(result);

    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error('❌ Failed to validate configuration:', error.message);
    process.exit(1);
  }
}
