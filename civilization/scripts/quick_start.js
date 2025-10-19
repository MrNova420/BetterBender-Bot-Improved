#!/usr/bin/env node

/**
 * Quick Non-Interactive Civilization Starter
 * For automated/workflow use
 */

const PresetGenerator = require('../presets/preset_generator');
const BotManager = require('../core/bot_manager');
const Logger = require('../../src/core/logger');
const ConfigValidator = require('./validate_config');

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let presetId = 'tiny_village';
  let serverHost = 'localhost';
  let serverPort = 25565;
  let serverVersion = '1.20.1';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--preset' && args[i + 1]) {
      presetId = args[i + 1];
      i++;
    } else if (args[i] === '--server' && args[i + 1]) {
      const parts = args[i + 1].split(':');
      serverHost = parts[0];
      serverPort = parseInt(parts[1]) || 25565;
      i++;
    } else if (args[i] === '--version' && args[i + 1]) {
      serverVersion = args[i + 1];
      i++;
    }
  }
  
  console.log('\n========================================');
  console.log('🏛️  BETTERBENDER CIVILIZATION');
  console.log('========================================\n');
  
  const generator = new PresetGenerator();
  const serverConfig = {
    host: serverHost,
    port: serverPort,
    version: serverVersion
  };
  
  console.log('⚙️  Generating civilization configuration...');
  const config = generator.generatePreset(presetId, serverConfig);
  
  console.log('\n📊 Civilization Summary:');
  console.log(`   Name: ${config.preset}`);
  console.log(`   Bots: ${config.botCount}`);
  console.log(`   Server: ${config.server.host}:${config.server.port}`);
  console.log(`   Version: ${config.server.version}`);
  
  // Validate configuration
  console.log('\n🔍 Validating configuration...');
  const validator = new ConfigValidator();
  const validationResult = validator.validateCivilizationConfig(config);
  
  if (!validationResult.valid) {
    console.log('\n❌ Configuration validation failed:\n');
    validationResult.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('\n');
    process.exit(1);
  }
  
  if (validationResult.warnings.length > 0) {
    console.log('\n⚠️  Configuration warnings:');
    validationResult.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }
  
  console.log('✅ Configuration validated successfully');
  console.log('\n🚀 Starting civilization...\n');
  
  // Initialize civilization
  const logger = new Logger({ logLevel: 'info', logFile: './data/logs/civilization.log' });
  
  const civilizationConfig = {
    bots: config.bots,
    dbPath: './data/civilization/civilization.db',
    wsPort: 8080,
    minecraftHost: config.server.host,
    minecraftPort: config.server.port,
    minecraftVersion: config.server.version
  };
  
  const botManager = new BotManager(civilizationConfig, logger);
  
  try {
    await botManager.start(config.bots);
    
    console.log('\n✅ Civilization started successfully!');
    console.log('\n📡 Dashboard: http://localhost:3001');
    console.log('📊 WebSocket: ws://localhost:8080');
    console.log(`\n${config.botCount} bots are now active and building their civilization!\n`);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping civilization...');
      await botManager.stop();
      console.log('✅ Civilization stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('\n❌ Failed to start civilization:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
