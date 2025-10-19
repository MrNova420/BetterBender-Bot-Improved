#!/usr/bin/env node

/**
 * Quick Launch Wrapper with Validation
 * Validates preset configuration before starting civilization
 */

const PresetGenerator = require('../presets/preset_generator');
const ConfigValidator = require('./validate_config');
const BotManager = require('../core/bot_manager');
const Logger = require('../../src/core/logger');
const path = require('path');
const fs = require('fs');

async function quickLaunch(presetId) {
  console.log(`\n🚀 Quick-launching ${presetId}...\n`);

  // Generate configuration
  const generator = new PresetGenerator();
  const serverConfig = {
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT) || 25565,
    version: process.env.MC_VERSION || '1.20.1'
  };

  const config = generator.generatePreset(presetId, serverConfig);

  console.log('📊 Civilization:',  config.preset);
  console.log('🤖 Bots:', config.botCount);
  console.log('🌍 Server:', `${config.server.host}:${config.server.port}`);

  // Validate configuration
  console.log('\n🔍 Validating...');
  const validator = new ConfigValidator();
  const validationResult = validator.validateCivilizationConfig(config);

  if (!validationResult.valid) {
    console.log('\n❌ Configuration validation failed:\n');
    validationResult.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('\nPlease fix the preset configuration or use "npm run civilization" for interactive setup.\n');
    process.exit(1);
  }

  if (validationResult.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validationResult.warnings.forEach((warning) => {
      console.log(`  - ${warning}`);
    });
  }

  console.log('✅ Configuration validated\n');

  // Save configuration
  const configDir = path.join(__dirname, '../../config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, 'active_civilization.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

  console.log('🚀 Starting civilization...\n');

  // Initialize civilization
  const logger = new Logger({ logLevel: 'info', logFile: './data/logs/civilization.log' });

  const civilizationConfig = {
    bots: config.bots,
    dbPath: './data/civilization/civilization.db',
    wsPort: 8080
  };

  const botManager = new BotManager(civilizationConfig, logger);

  try {
    await botManager.start(config.bots);

    console.log('\n✅ Civilization started successfully!');
    console.log('\n📡 Dashboard: http://localhost:3001');
    console.log('📊 WebSocket: ws://localhost:8080');
    console.log('\nPress Ctrl+C to stop the civilization\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down civilization...');
      await botManager.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Failed to start civilization:', error.message);
    logger.error('[QuickLaunch] Startup error:', error);
    process.exit(1);
  }
}

// Get preset ID from command line
const presetId = process.argv[2];

if (!presetId) {
  console.error('Usage: node quick_launch.js <preset_id>');
  console.error('Available presets: tiny_village, small_town, medium_city, large_metropolis, mega_civilization');
  process.exit(1);
}

quickLaunch(presetId).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
