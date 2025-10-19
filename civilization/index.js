#!/usr/bin/env node

require('dotenv').config();
const BotManager = require('./core/bot_manager');
const OfflineSimulation = require('./core/offline_simulation');
const fs = require('fs');
const path = require('path');

class Logger {
  info(message, ...args) {
    console.log(`[INFO] ${new Date().toISOString()} -`, message, ...args);
  }
  
  warn(message, ...args) {
    console.log(`[WARN] ${new Date().toISOString()} -`, message, ...args);
  }
  
  error(message, ...args) {
    console.error(`[ERROR] ${new Date().toISOString()} -`, message, ...args);
  }
}

const logger = new Logger();

const config = {
  minecraftHost: process.env.MINECRAFT_HOST || 'localhost',
  minecraftPort: parseInt(process.env.MINECRAFT_PORT || '25565'),
  minecraftVersion: process.env.MINECRAFT_VERSION || '1.20.1',
  wsPort: parseInt(process.env.WS_PORT || '8080'),
  dbPath: process.env.DB_PATH || './data/civilization/civilization.db',
  bots: []
};

const numBots = parseInt(process.env.NUM_BOTS || '3');
const personalityTypes = ['default', 'explorer', 'builder', 'social', 'gatherer'];

for (let i = 0; i < numBots; i++) {
  config.bots.push({
    id: `bot_${i + 1}`,
    name: `CivBot_${i + 1}`,
    personalityType: personalityTypes[i % personalityTypes.length]
  });
}

async function main() {
  logger.info('='.repeat(60));
  logger.info('MINECRAFT CIVILIZATION SYSTEM');
  logger.info('Autonomous Bot Society Simulator');
  logger.info('='.repeat(60));
  
  const manager = new BotManager(config, logger);
  const offlineSim = new OfflineSimulation(manager.db, logger);
  
  const lastOnlineFile = path.join(__dirname, '../data/civilization/.last_online');
  let lastOnlineTime = null;
  
  if (fs.existsSync(lastOnlineFile)) {
    try {
      lastOnlineTime = parseInt(fs.readFileSync(lastOnlineFile, 'utf8'));
      
      if (offlineSim.shouldSimulate(lastOnlineTime)) {
        logger.info('Simulating offline time...');
        const simResult = offlineSim.simulateOfflineTime(lastOnlineTime, Date.now());
        logger.info(`Offline simulation complete: ${simResult.hoursSimulated.toFixed(2)} hours simulated`);
      }
    } catch (error) {
      logger.warn('Could not load last online time:', error.message);
    }
  }
  
  await manager.start();
  
  logger.info('Civilization system is now running!');
  logger.info(`- ${config.bots.length} bots will spawn`);
  logger.info(`- WebSocket broker on port ${config.wsPort}`);
  logger.info(`- Database: ${config.dbPath}`);
  logger.info('Press Ctrl+C to stop');
  
  process.on('SIGINT', async () => {
    logger.info('\nShutdown signal received...');
    
    fs.writeFileSync(lastOnlineFile, Date.now().toString());
    
    await manager.stop();
    
    logger.info('Civilization system stopped. Goodbye!');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('\nTermination signal received...');
    fs.writeFileSync(lastOnlineFile, Date.now().toString());
    await manager.stop();
    process.exit(0);
  });
  
  setInterval(() => {
    const status = manager.getCivilizationStatus();
    logger.info(`Status: ${status.activeBots}/${status.totalBots} bots active, ${status.villages} villages`);
  }, 60000);
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
