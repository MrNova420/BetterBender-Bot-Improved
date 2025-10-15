#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

async function setup() {
  try {
    const configPath = path.join(__dirname, 'config', 'settings.json');
    let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Check if already configured
    if (config.server.ip !== 'localhost' && !config.server.ip.includes('SETUP')) {
      console.log('✅ Bot is already configured!');
      console.log(`📋 Server: ${config.server.ip}:${config.server.port}`);
      console.log(`🤖 Bot: ${config['bot-account'].username}`);
      console.log(`🎮 Mode: ${config.mode.current}`);
      console.log('\n🚀 Starting bot...\n');
      rl.close();
      setTimeout(() => {
        require('./bot-enhanced.js');
      }, 500);
      return;
    }

    console.clear();
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     🎮 BetterSMP Bot - Automated Setup Wizard         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📝 Let\'s configure your bot in 4 simple steps!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 1: Bot Name');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const botName = await ask('Enter bot username (e.g., HelperBot): ');
    if (!botName) {
      throw new Error('Bot name is required!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2: Minecraft Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const serverIp = await ask('Enter server IP (e.g., play.example.com): ');
    if (!serverIp) {
      throw new Error('Server IP is required!');
    }

    const serverPort = await ask('Enter server port [25565]: ') || '25565';
    const mcVersion = await ask('Enter Minecraft version (e.g., 1.20.1): ');
    if (!mcVersion) {
      throw new Error('Minecraft version is required!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 3: Starting Mode');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Basic Mode   - AFK prevention + Chat responses');
    console.log('2. Advanced Mode - Full autonomous features (mining, building, etc.)');
d    const modeChoice = await ask('\nSelect mode [1 or 2]: ');
    const mode = modeChoice === '2' ? 'advanced' : 'basic';

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 4: Account Type');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Offline/Cracked (most common)');
    console.log('2. Microsoft Account');
    console.log('3. Mojang Account');
    const accountChoice = await ask('\nSelect account type [1, 2, or 3]: ');
    
    let accountType = 'offline';
    let password = '';
    
    if (accountChoice === '2') {
      accountType = 'microsoft';
      password = await ask('Enter Microsoft password: ');
    } else if (accountChoice === '3') {
      accountType = 'mojang';
      password = await ask('Enter Mojang password: ');
    }

    config['bot-account'].username = botName;
    config['bot-account'].password = password;
    config['bot-account'].type = accountType;
    config.server.ip = serverIp;
    config.server.port = parseInt(serverPort);
    config.server.version = mcVersion;
    config.server.name = serverIp.split('.')[0];
    config.mode.current = mode;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ Setup Complete!                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log('📋 Configuration Summary:');
    console.log(`   Bot Name: ${botName}`);
    console.log(`   Server: ${serverIp}:${serverPort}`);
    console.log(`   Version: ${mcVersion}`);
    console.log(`   Mode: ${mode}`);
    console.log(`   Account: ${accountType}`);
    console.log('\n🚀 Starting your bot...\n');

    rl.close();

    setTimeout(() => {
      require('./bot-enhanced.js');
    }, 1000);

  } catch (error) {
    console.error('\n❌ Setup Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

setup();

