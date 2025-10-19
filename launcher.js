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
  
  // Check for command-line argument (for non-interactive mode)
  const cliMode = process.argv[2];
  let choice = cliMode;
  
  if (!cliMode) {
    // Interactive mode
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
    
    choice = await question('Select mode (1-3): ');
  } else {
    console.log(`🔧 Auto-starting mode ${cliMode} (non-interactive)\n`);
  }
  
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
    } else {
      console.log('❌ No config template found. Please create CONFIG.json manually.');
      process.exit(1);
    }
  }
  
  console.log('📖 Configuration: CONFIG.json');
  console.log('📡 Dashboard will be at: http://localhost:5000\n');
  
  // Load config and start bot with dashboard in-process
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const BotEngine = require('./src/engine');
  const DashboardServer = require('./dashboard/server');
  
  const engine = new BotEngine(config);
  
  // Register all addons
  const AFKAddon = require('./addons/afk');
  const PlayerAddon = require('./addons/player');
  const CraftingAddon = require('./addons/crafting');
  const PathfindingAddon = require('./addons/pathfinding');
  const MiningAddon = require('./addons/mining');
  const BuildingAddon = require('./addons/building');
  const TradingAddon = require('./addons/trading');
  
  engine.registerAddon(AFKAddon);
  engine.registerAddon(PlayerAddon);
  engine.registerAddon(CraftingAddon);
  engine.registerAddon(PathfindingAddon);
  engine.registerAddon(MiningAddon);
  engine.registerAddon(BuildingAddon);
  engine.registerAddon(TradingAddon);
  
  // Start dashboard and bot
  const dashboard = new DashboardServer(config, engine);
  await dashboard.start();
  await engine.start();
  
  console.log('\n✅ Single Bot Mode started successfully!');
  console.log('📡 Dashboard: http://localhost:5000\n');
}

async function launchCivilization() {
  // Launch the interactive civilization launcher
  const { spawn } = require('child_process');
  
  const child = spawn('node', ['civilization/scripts/start_civilization.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  child.on('exit', (code) => {
    process.exit(code);
  });
}

async function launchDashboard() {
  const { spawn } = require('child_process');
  
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const dashboardType = await new Promise(resolve => {
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
    const child = spawn('node', ['dashboard/server.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('exit', (code) => {
      process.exit(code);
    });
  } else if (dashboardType === '2') {
    console.log('Starting Civilization Dashboard on http://localhost:3001\n');
    const child = spawn('node', ['civilization/dashboard/civilization_server.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('exit', (code) => {
      process.exit(code);
    });
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
