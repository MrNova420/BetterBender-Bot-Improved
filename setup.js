#!/usr/bin/env node

/**
 * BetterBender 2.0 - Automatic Setup & Installation
 * Auto-installs dependencies and configures everything needed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║  🤖 BETTERBENDER 2.0 - AUTOMATIC SETUP 🤖    ║');
console.log('╚════════════════════════════════════════════════╝\n');

async function main() {
  console.log('🔍 Checking system requirements...\n');
  
  // Check Node.js version
  const nodeVersion = process.version.match(/^v(\d+\.\d+)/)[1];
  const nodeMajor = parseInt(nodeVersion.split('.')[0]);
  
  if (nodeMajor < 18) {
    console.log('❌ Node.js 18 or higher required!');
    console.log(`   Current version: ${process.version}`);
    console.log('   Please upgrade: https://nodejs.org/\n');
    process.exit(1);
  }
  
  console.log(`✅ Node.js ${process.version} detected`);
  
  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    console.log('   Try running: npm install');
    process.exit(1);
  }
  
  // Create necessary directories
  console.log('\n📁 Creating directories...');
  const dirs = [
    'data',
    'data/logs',
    'data/civilization',
    'config',
    'data/backups'
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   ✅ Created ${dir}/`);
    }
  }
  
  // Check for CONFIG.json
  console.log('\n⚙️  Configuring bot...');
  
  const configExists = fs.existsSync('CONFIG.json');
  
  if (!configExists) {
    console.log('\n📝 Let\'s set up your Minecraft server connection:\n');
    
    const host = await question('Server address (e.g., localhost, play.server.com): ');
    const port = await question('Server port (default: 25565): ') || '25565';
    const version = await question('Minecraft version (default: 1.20.1): ') || '1.20.1';
    const botName = await question('Bot username (default: BetterBot): ') || 'BetterBot';
    
    const authType = await question('\nAuthentication type?\n  1. Offline (no account needed)\n  2. Microsoft Account\nSelect (1-2): ');
    
    const config = {
      server: {
        host: host,
        port: parseInt(port),
        version: version
      },
      auth: {
        type: authType === '2' ? 'microsoft' : 'offline',
        username: botName,
        password: ""
      },
      mode: {
        current: "player",
        autoSwitch: false
      },
      safety: {
        maxCpuPercent: 45,
        maxMemoryMB: 512,
        maxBlocksPerHour: 200,
        checkIntervalMs: 45000,
        enableThermalMonitoring: true,
        enableBatteryMonitoring: true,
        autoThrottle: true
      },
      dashboard: {
        enabled: true,
        port: 5000,
        adminToken: 'CHANGE_THIS_TOKEN_' + Math.random().toString(36).substring(7)
      },
      afkMode: {
        movementPattern: "random",
        movementInterval: 20000,
        movementRange: 5,
        autoEat: true,
        autoRespawn: true,
        avoidMobs: true,
        statusUpdateInterval: 90000
      },
      playerMode: {
        workDuration: 1800000,
        restDuration: 300000,
        tradeDuration: 600000,
        socialDuration: 900000,
        exploreDuration: 1200000,
        maxBlocksPerCycle: 100,
        smartInventory: true,
        useChests: true,
        helpPlayers: true,
        buildCommunity: true,
        respondToChat: true
      },
      reconnect: {
        enabled: true,
        maxAttempts: 75,
        initialDelayMs: 5000,
        maxDelayMs: 60000,
        backoffMultiplier: 1.5
      },
      logging: {
        level: "info",
        logToFile: true,
        logDir: "data/logs",
        maxLogSizeMB: 10,
        maxLogFiles: 5
      },
      tasks: {
        persistDir: "data/tasks",
        enablePersistence: true,
        maxQueueSize: 100
      }
    };
    
    fs.writeFileSync('CONFIG.json', JSON.stringify(config, null, 2));
    console.log('\n✅ Configuration saved to CONFIG.json');
  } else {
    console.log('✅ CONFIG.json already exists');
  }
  
  // Create .gitignore if needed
  if (!fs.existsSync('.gitignore')) {
    const gitignore = `# Dependencies
node_modules/
package-lock.json

# Configuration (contains sensitive info)
CONFIG.json
config/settings.json

# Data & Logs
data/
*.log
*.db
*.db-journal

# System files
.DS_Store
Thumbs.db
*.swp
*.swo
*~

# IDE
.vscode/
.idea/
*.iml
`;
    fs.writeFileSync('.gitignore', gitignore);
    console.log('✅ Created .gitignore');
  }
  
  // Success summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║          ✅ SETUP COMPLETE! ✅                ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log('🚀 You\'re ready to go! Choose how to start:\n');
  console.log('📋 OPTION 1: Interactive Launcher (Recommended)');
  console.log('   npm start\n');
  
  console.log('🤖 OPTION 2: Single Bot Mode');
  console.log('   npm run bot\n');
  
  console.log('🏛️  OPTION 3: Civilization Mode');
  console.log('   npm run civilization\n');
  
  console.log('⚡ OPTION 4: Quick Civilization Presets');
  console.log('   npm run civ:tiny    # 5 bots');
  console.log('   npm run civ:small   # 10 bots');
  console.log('   npm run civ:medium  # 20 bots');
  console.log('   npm run civ:large   # 30 bots');
  console.log('   npm run civ:mega    # 50 bots\n');
  
  console.log('📚 Documentation:');
  console.log('   README.md - Full guide');
  console.log('   CIVILIZATION_QUICK_START.md - Civilization guide\n');
  
  console.log('💡 Tip: The bot works on ANY Minecraft server:');
  console.log('   ✅ Vanilla servers');
  console.log('   ✅ Modded servers (Paper, Spigot, Fabric, Forge)');
  console.log('   ✅ Any version (auto-adapts)\n');
  
  rl.close();
}

main().catch(err => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
