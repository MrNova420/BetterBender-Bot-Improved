#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 3) {
    console.log('\n🎮 BetterSMP Bot - Quick Configuration');
    console.log('\nUsage: node quick-config.js <username> <server-ip> <version> [port] [type] [password]');
    console.log('\nExamples:');
    console.log('  # Offline/Cracked server');
    console.log('  node quick-config.js MyBot play.example.com 1.20.1');
    console.log('  node quick-config.js MyBot 192.168.1.100 1.19.4 25565 offline');
    console.log('');
    console.log('  # Microsoft account (device code login - no password!)');
    console.log('  node quick-config.js email@outlook.com hypixel.net 1.20.1 25565 microsoft');
    console.log('  (You\'ll get a code on screen to login via browser)');
    console.log('');
    console.log('  # Mojang account (legacy - password required)');
    console.log('  node quick-config.js username mc.server.com 1.19.4 25565 mojang YourPassword');
    console.log('\nArguments:');
    console.log('  username    - Bot name or email (required)');
    console.log('  server-ip   - Minecraft server IP (required)');
    console.log('  version     - Minecraft version like 1.20.1 (required)');
    console.log('  port        - Server port (optional, default: 25565)');
    console.log('  type        - Account type: offline/microsoft/mojang (optional, default: offline)');
    console.log('  password    - Account password (only for mojang legacy accounts)');
    console.log('\n💡 Tips:');
    console.log('  - Offline/Cracked: No password needed');
    console.log('  - Microsoft: Uses device code (you login in browser, no password in config)');
    console.log('  - Mojang Legacy: Requires password (old accounts only)\n');
    process.exit(1);
}

const username = args[0];
const serverIp = args[1];
const version = args[2];
const port = args[3] || '25565';
const accountType = args[4] || 'offline';
const password = args[5] || '';

console.log('\n⚙️  Configuring bot...\n');

try {
    const configPath = path.join(__dirname, 'config', 'settings.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    config['bot-account'].username = username;
    config['bot-account'].password = password;
    config['bot-account'].type = accountType;

    config.server.ip = serverIp;
    config.server.port = parseInt(port);
    config.server.version = version;
    config.server.name = serverIp.split('.')[0];

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('✅ Configuration saved successfully!\n');
    console.log('📋 Settings:');
    console.log(`   Bot Username: ${username}`);
    console.log(`   Server: ${serverIp}:${port}`);
    console.log(`   Version: ${version}`);
    console.log(`   Account Type: ${accountType}`);
    if (accountType === 'mojang' && password) {
        console.log(`   Password: ${'*'.repeat(password.length)} (saved)`);
    } else if (accountType === 'microsoft') {
        console.log('   Auth: Device code (you\'ll login via browser when bot starts)');
    }
    console.log('\n🚀 Your bot is ready! Run: npm start');
    console.log('💡 Or in Termux, run: ./start-termux.sh');
    if (accountType === 'microsoft') {
        console.log('\n📱 Microsoft Login: When bot starts, visit the URL shown and enter the code!\n');
    } else {
        console.log('');
    }

} catch (error) {
    console.error('❌ Configuration error:', error.message);
    process.exit(1);
}
