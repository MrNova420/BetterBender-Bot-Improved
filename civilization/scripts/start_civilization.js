#!/usr/bin/env node

/**
 * Interactive Civilization Starter
 * User-friendly script to launch pre-configured civilizations
 */

const readline = require('readline');
const PresetGenerator = require('../presets/preset_generator');
const BotManager = require('../core/bot_manager');
const Logger = require('../../src/core/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n========================================');
  console.log('🏛️  BETTERBENDER CIVILIZATION LAUNCHER');
  console.log('========================================\n');
  
  const generator = new PresetGenerator();
  const presets = generator.getAvailablePresets();
  
  console.log('📋 Available Civilizations:\n');
  presets.forEach((preset, index) => {
    console.log(`${index + 1}. ${preset.name} (${preset.botCount} bots)`);
    console.log(`   ${preset.description}\n`);
  });
  
  const choice = await question('Select a civilization (1-' + presets.length + '): ');
  const selectedIndex = parseInt(choice) - 1;
  
  if (selectedIndex < 0 || selectedIndex >= presets.length) {
    console.log('❌ Invalid selection');
    rl.close();
    return;
  }
  
  const selectedPreset = presets[selectedIndex];
  console.log(`\n✅ Selected: ${selectedPreset.name}`);
  
  // Server configuration
  console.log('\n🌍 Server Configuration:');
  const host = await question('Minecraft server host (default: localhost): ') || 'localhost';
  const port = await question('Minecraft server port (default: 25565): ') || '25565';
  const version = await question('Minecraft version (default: 1.20.1): ') || '1.20.1';
  
  const serverConfig = {
    host: host,
    port: parseInt(port),
    version: version
  };
  
  console.log('\n⚙️  Generating civilization configuration...');
  const config = generator.generatePreset(selectedPreset.id, serverConfig);
  
  console.log('\n📊 Civilization Summary:');
  console.log(`   Name: ${config.preset}`);
  console.log(`   Bots: ${config.botCount}`);
  console.log(`   Server: ${config.server.host}:${config.server.port}`);
  console.log(`   Version: ${config.server.version}`);
  
  const confirm = await question('\nStart civilization? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Starting civilization...\n');
  rl.close();
  
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
    logger.error('[Launcher] Startup error:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
