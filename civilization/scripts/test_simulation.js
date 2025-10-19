#!/usr/bin/env node

require('dotenv').config();
const CivilizationDatabase = require('../db/database');
const OfflineSimulation = require('../core/offline_simulation');

class TestLogger {
  info(...args) { console.log('[TEST]', ...args); }
  warn(...args) { console.log('[WARN]', ...args); }
  error(...args) { console.error('[ERROR]', ...args); }
}

const logger = new TestLogger();

async function runTest() {
  logger.info('Starting Offline Simulation Test...');
  
  const db = new CivilizationDatabase('./data/civilization/test_simulation.db');
  const offlineSim = new OfflineSimulation(db, logger);
  
  logger.info('Creating test bots...');
  
  const testBots = [
    { id: 'test_bot_1', name: 'TestExplorer', personality: { curiosity: 0.9, work_ethic: 0.7 } },
    { id: 'test_bot_2', name: 'TestBuilder', personality: { curiosity: 0.4, work_ethic: 0.95 } },
    { id: 'test_bot_3', name: 'TestSocial', personality: { curiosity: 0.6, work_ethic: 0.6 } }
  ];
  
  for (const bot of testBots) {
    db.createBot({
      id: bot.id,
      name: bot.name,
      username: bot.name,
      x: Math.random() * 100,
      y: 64,
      z: Math.random() * 100
    });
    
    db.setPersonality(bot.id, bot.personality);
    
    db.addEmotion(bot.id, {
      hunger: 0.3,
      safety: 0.8,
      loneliness: 0.5,
      boredom: 0.4,
      curiosity: bot.personality.curiosity,
      satisfaction: 0.5,
      stress: 0.2
    });
  }
  
  logger.info('Simulating 8 hours of offline time...');
  const startTime = Date.now() - (8 * 3600000);
  const endTime = Date.now();
  
  const result = offlineSim.simulateOfflineTime(startTime, endTime);
  
  logger.info('Simulation Results:');
  logger.info(`- Hours simulated: ${result.hoursSimulated.toFixed(2)}`);
  logger.info(`- Bots simulated: ${result.botsSimulated}`);
  logger.info(`- Events generated: ${result.eventsGenerated}`);
  
  logger.info('\nBot Status After Simulation:');
  for (const bot of testBots) {
    const botData = db.getBot(bot.id);
    const emotions = db.getLatestEmotions(bot.id);
    const memories = db.getRecentMemories(bot.id, 10);
    
    logger.info(`\n${bot.name}:`);
    logger.info(`  Position: (${botData.position_x.toFixed(1)}, ${botData.position_z.toFixed(1)})`);
    logger.info(`  Health: ${botData.health}, Food: ${botData.food}`);
    logger.info(`  Emotions: Hunger=${emotions.hunger.toFixed(2)}, Boredom=${emotions.boredom.toFixed(2)}`);
    logger.info(`  Memories: ${memories.length} recent events`);
  }
  
  const events = db.getRecentEvents(20);
  logger.info(`\n${events.length} Recent Events:`);
  events.slice(0, 5).forEach(event => {
    logger.info(`  - ${event.type}: ${event.description}`);
  });
  
  db.close();
  logger.info('\nTest complete!');
}

runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
