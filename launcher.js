#!/usr/bin/env node

/**
 * BetterBender 2.0 - Unified Launcher
 * Seamlessly launch Single Bot or Civilization mode
 */

const readline = require('readline');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   🤖 BETTERBENDER 2.0 LAUNCHER 🤖     ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log('Choose your mode:\n');
  console.log('1. 🤖 Single Bot Mode');
  console.log('   - One autonomous bot');
  console.log('   - Builds homes, gathers resources, trades');
  console.log('   - Perfect for personal use\n');
  
  console.log('2. 🏛️  Civilization Mode');
  console.log('   - Multiple AI bots with personalities');
  console.log('   - Form villages, develop cultures');
  console.log('   - Build societies that evolve\n');
  
  console.log('3. 📊 Dashboard Only');
  console.log('   - View running bots without starting new ones');
  console.log('   - Monitor existing civilization\n');
  
  const choice = await question('Select mode (1-3): ');
  rl.close();
  
  console.log(''); // Blank line for readability
  
  switch (choice.trim()) {
    case '1':
      console.log('🚀 Launching Single Bot Mode...\n');
      await launchSingleBot();
      break;
      
    case '2':
      console.log('🚀 Launching Civilization Mode...\n');
      await launchCivilization();
      break;
      
    case '3':
      console.log('📊 Starting Dashboard...\n');
      await launchDashboard();
      break;
      
    default:
      console.log('❌ Invalid selection. Exiting.');
      process.exit(1);
  }
}

async function launchSingleBot() {
  // Check if config exists
  const configPath = path.join(__dirname, 'CONFIG.json');
  
  if (!fs.existsSync(configPath)) {
    console.log('⚠️  No CONFIG.json found. Creating from template...');
    const templatePath = path.join(__dirname, 'CONFIG.example.json');
    
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, configPath);
      console.log('✅ Created CONFIG.json from template');
      console.log('📝 Please edit CONFIG.json to add your server details');
      console.log('Then run: npm start\n');
      process.exit(0);
    }
  }
  
  console.log('📖 Configuration: CONFIG.json');
  console.log('📡 Dashboard will be at: http://localhost:5000\n');
  
  // Launch single bot with dashboard
  require('./dashboard/server.js');
}

async function launchCivilization() {
  // Use the interactive civilization launcher
  const civLauncher = require('./civilization/scripts/start_civilization.js');
  // The civilization launcher is already interactive, so it will handle the rest
}

async function launchDashboard() {
  const dashboardType = await new Promise(resolve => {
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('Which dashboard?');
    console.log('1. Single Bot Dashboard (port 5000)');
    console.log('2. Civilization Dashboard (port 3001)');
    
    rl2.question('Select (1-2): ', answer => {
      rl2.close();
      resolve(answer.trim());
    });
  });
  
  if (dashboardType === '1') {
    console.log('Starting Single Bot Dashboard on http://localhost:5000\n');
    require('./dashboard/server.js');
  } else if (dashboardType === '2') {
    console.log('Starting Civilization Dashboard on http://localhost:3001\n');
    require('./civilization/dashboard/civilization_server.js');
  } else {
    console.log('❌ Invalid selection');
    process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Fatal Error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled Error:', error.message);
  process.exit(1);
});

// Run launcher
if (require.main === module) {
  main().catch(err => {
    console.error('Launcher error:', err);
    process.exit(1);
  });
}

module.exports = { main, launchSingleBot, launchCivilization, launchDashboard };
